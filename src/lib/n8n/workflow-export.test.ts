import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type WorkflowNode = {
  name: string;
  type: string;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  parameters?: Record<string, unknown>;
};

type WorkflowExport = {
  name: string;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
};

const rootDir = process.cwd();
const workflow = readJson<WorkflowExport>("n8n/workflows/digital-ethiopia-ingestion.json");

describe("n8n ingestion workflow export", () => {
  it("contains the required orchestration nodes", () => {
    expect(nodeNames()).toEqual(
      expect.arrayContaining([
        "Hourly Cron",
        "Start Pipeline Run",
        "Expand KPI Batch",
        "Priority URLs First",
        "Fetch Priority URL",
        "Apply Document Budget",
        "Fallback Already Used?",
        "More Priority URLs?",
        "Increment Priority Index",
        "OpenAI Query Generation",
        "Tavily Search via App Provider",
        "Filter Search URLs",
        "Store Raw Document",
        "OpenAI Relevance Gate",
        "OpenAI Structured Extraction",
        "Store Observation",
        "Complete Pipeline Run",
      ]),
    );
  });

  it("runs hourly and uses app ingestion API boundaries", () => {
    expect(findNode("Hourly Cron").parameters).toMatchObject({
      rule: { interval: [{ field: "hours", hoursInterval: 1 }] },
    });

    const appHttpNodes = workflow.nodes.filter(
      (node) =>
        node.type === "n8n-nodes-base.httpRequest" &&
        JSON.stringify(node.parameters).includes("{{$env.APP_BASE_URL}}/api/ingestion/"),
    );

    expect(appHttpNodes.map((node) => node.name)).toEqual(
      expect.arrayContaining([
        "Start Pipeline Run",
        "Tavily Search via App Provider",
        "Filter Search URLs",
        "Store Raw Document",
        "Store Observation",
        "Complete Pipeline Run",
      ]),
    );
    expect(JSON.stringify(appHttpNodes)).toContain("INGESTION_API_KEY");
  });

  it("applies node-level retries to transient external and database-backed calls", () => {
    const retriedNodes = workflow.nodes.filter((node) => node.retryOnFail);
    expect(retriedNodes.map((node) => node.name)).toEqual(
      expect.arrayContaining([
        "Start Pipeline Run",
        "Fetch Priority URL",
        "Store Raw Document",
        "OpenAI Relevance Gate",
        "OpenAI Structured Extraction",
        "Tavily Search via App Provider",
        "Store Observation",
        "Complete Pipeline Run",
      ]),
    );

    for (const node of retriedNodes) {
      expect(node.maxTries).toBe(5);
      expect(node.waitBetweenTries).toBe(2000);
    }
  });

  it("uses priority sources before fallback search and releases successful runs", () => {
    expect(JSON.stringify(workflow.connections["Has Priority URLs?"])).toContain(
      "Expand Priority URLs",
    );
    expect(JSON.stringify(workflow.connections["Has Priority URLs?"])).toContain(
      "OpenAI Query Generation",
    );
    expect(outgoingNodeNames("New Document?")).not.toContain("OpenAI Query Generation");
    expect(outgoingNodeNames("Relevant?")).not.toContain("OpenAI Query Generation");
    expect(outgoingNodeNames("New Document?")).toContain("More Priority URLs?");
    expect(outgoingNodeNames("Relevant?")).toContain("More Priority URLs?");
    expect(outgoingNodeNames("More Priority URLs?")).toEqual(
      expect.arrayContaining(["Increment Priority Index", "Fallback Already Used?"]),
    );
    expect(outgoingNodeNames("Increment Priority Index")).toEqual(["Expand Priority URLs"]);
    expect(outgoingNodeNames("Fallback Already Used?")).toEqual(
      expect.arrayContaining(["Complete Pipeline Run", "Mark Fallback Used"]),
    );
    expect(outgoingNodeNames("Mark Fallback Used")).toEqual(["OpenAI Query Generation"]);
    expect(JSON.stringify(workflow.connections["Store Observation"])).toContain(
      "Complete Pipeline Run",
    );
  });

  it("caps document fetch branches and routes malformed terminal paths to completion", () => {
    expect(findNode("Apply Document Budget").parameters?.jsCode).toContain("10 - start");
    expect(findNode("Apply Document Budget").parameters?.jsCode).toContain("documentsProcessed");
    expect(outgoingNodeNames("Expand Priority URLs")).toEqual(["Apply Document Budget"]);
    expect(outgoingNodeNames("Expand Filtered URLs")).toEqual(["Apply Document Budget"]);
    expect(outgoingNodeNames("Apply Document Budget")).toEqual(["Has URL?"]);
    expect(outgoingNodeNames("Has URL?")).toEqual(
      expect.arrayContaining(["Fetch Priority URL", "Complete Pipeline Run"]),
    );

    for (const nodeName of ["Has Raw Text?", "Has Relevance JSON?", "Has Extraction JSON?"]) {
      expect(outgoingNodeNames(nodeName)).toEqual(expect.arrayContaining(["More Priority URLs?"]));
    }

    expect(outgoingNodeNames("Has Query JSON?")).toEqual(
      expect.arrayContaining(["Tavily Search via App Provider", "Complete Pipeline Run"]),
    );
    expect(JSON.stringify(workflow.nodes)).not.toContain("return []");
  });

  it("documents strict mocked AI/search response shapes", () => {
    expect(readJson("n8n/mocks/openai-query-generation.json")).toMatchObject({
      queries: expect.arrayContaining([expect.any(String)]),
    });
    expect(readJson("n8n/mocks/openai-relevance.json")).toMatchObject({
      confidence: expect.any(Number),
      relevant: expect.any(Boolean),
    });
    expect(readJson("n8n/mocks/openai-extraction.json")).toMatchObject({
      confidence: expect.any(Number),
      explanation: expect.any(String),
      observed_date: expect.any(String),
      region: expect.any(String),
      unit: expect.any(String),
      value_numeric: expect.any(Number),
    });
    expect(readJson("n8n/mocks/tavily-search.json")).toMatchObject({
      results: expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String),
          url: expect.any(String),
        }),
      ]),
    });
  });
});

function nodeNames() {
  return workflow.nodes.map((node) => node.name);
}

function findNode(name: string) {
  const node = workflow.nodes.find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Missing n8n node: ${name}`);
  }

  return node;
}

function outgoingNodeNames(name: string) {
  const connection = workflow.connections[name] as
    { main?: Array<Array<{ node: string }>> } | undefined;

  return connection?.main?.flatMap((branch) => branch.map((target) => target.node)) ?? [];
}

function readJson<T = unknown>(path: string): T {
  return JSON.parse(readFileSync(join(rootDir, path), "utf8")) as T;
}
