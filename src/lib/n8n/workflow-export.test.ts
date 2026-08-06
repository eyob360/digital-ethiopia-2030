import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type WorkflowNode = {
  name: string;
  type: string;
  typeVersion?: number;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  onError?: string;
  parameters?: Record<string, unknown>;
};

type IfConditions = {
  options?: { version?: number };
  combinator?: string;
  conditions?: Array<{
    id?: string;
    leftValue?: unknown;
    rightValue?: unknown;
    operator?: { type?: string; operation?: string };
  }>;
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
        "Observation Accepted?",
        "Store Error Context",
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

  it("uses priority sources before fallback search and releases only through branch completion", () => {
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
    expect(branchTargets("Store Observation", 0)).toEqual(["Observation Accepted?"]);
    expect(outgoingNodeNames("Observation Accepted?")).toEqual(
      expect.arrayContaining(["Complete Pipeline Run", "More Priority URLs?"]),
    );
    expect(findNode("Extract Readable Text").parameters?.jsCode).toContain(
      "$('Has URL?').item.json",
    );
    expect(findNode("Extract Readable Text").parameters?.jsCode).not.toContain(
      "$('Expand Priority URLs')",
    );
    expect(findNode("Expand Priority URLs").parameters?.jsCode).toContain(
      "contextFrom('Priority URLs First')",
    );
    expect(findNode("Mark Fallback Used").parameters?.jsCode).toContain(
      "contextFrom('Priority URLs First')",
    );
    expect(findNode("Validate Relevance JSON").parameters?.jsCode).toContain(
      "$('Store Raw Document').item.json",
    );
    expect(findNode("Validate Extraction JSON").parameters?.jsCode).toContain(
      "$('Store Raw Document').item.json",
    );
    expect(findNode("Validate Extraction JSON").parameters?.jsCode).toContain(
      "sourceType: context.sourceType",
    );
    expect(findNode("Validate Extraction JSON").parameters?.jsCode).toContain(
      "candidateUrls: context.candidateUrls",
    );
    expect(findNode("Validate Extraction JSON").parameters?.jsCode).toContain(
      "priorityIndex: context.priorityIndex",
    );
    expect(findNode("Validate Query JSON").parameters?.jsCode).toContain(
      "contextFrom('Mark Fallback Used')",
    );
    expect(findNode("Validate Query JSON").parameters?.jsCode).toContain(
      "contextFrom('Priority URLs First')",
    );
    expect(findNode("Expand Filtered URLs").parameters?.jsCode).toContain(
      "$('Validate Query JSON').item.json",
    );
    expect(findNode("Expand KPI Batch").parameters?.jsCode).toContain("runId: $json.runId");
    expect(findNode("Expand KPI Batch").parameters?.jsCode).toContain("branchKey: kpi.id");
    expect(findNode("Complete Pipeline Run").parameters?.jsonBody).toContain('"runId"');
    expect(findNode("Complete Pipeline Run").parameters?.jsonBody).toContain('"branchKey"');
  });

  it("declares every IF node's conditions in the format matching its typeVersion", () => {
    const ifNodes = workflow.nodes.filter((node) => node.type === "n8n-nodes-base.if");
    expect(ifNodes).toHaveLength(12);

    for (const node of ifNodes) {
      const conditions = node.parameters?.conditions as IfConditions | undefined;
      expect(conditions, node.name).toBeDefined();

      if ((node.typeVersion ?? 1) >= 2) {
        // Legacy typeVersion-1 shapes under a typeVersion-2 IF node never evaluate:
        // every item silently routes to the true output (VAL-WO-0010 round 2, Failure 1).
        for (const legacyKey of ["boolean", "string", "number", "dateTime"]) {
          expect(conditions, `${node.name} uses legacy '${legacyKey}' shape`).not.toHaveProperty(
            legacyKey,
          );
        }
        expect(conditions?.options?.version, node.name).toBe(2);
        expect(conditions?.combinator, node.name).toBe("and");
        expect(Array.isArray(conditions?.conditions), node.name).toBe(true);
        expect((conditions?.conditions ?? []).length, node.name).toBeGreaterThan(0);
        for (const rule of conditions?.conditions ?? []) {
          expect(typeof rule.id, node.name).toBe("string");
          expect(typeof rule.leftValue, node.name).toBe("string");
          expect(typeof rule.operator?.type, node.name).toBe("string");
          expect(typeof rule.operator?.operation, node.name).toBe("string");
        }
      } else {
        expect(conditions, node.name).not.toHaveProperty("combinator");
      }
    }
  });

  it("routes rejected priority observation candidates toward fallback search", () => {
    expect(findNode("Store Observation").parameters?.jsonBody).toBe("={{$json}}");
    expect(findNode("Observation Accepted?").parameters).toMatchObject({
      conditions: {
        options: { version: 2 },
        combinator: "and",
        conditions: [
          {
            leftValue: "={{ $json.status ?? '' }}",
            rightValue: "inserted",
            operator: { type: "string", operation: "equals" },
          },
        ],
      },
    });

    // Rejected observations (false output, index 1) must head toward fallback,
    // never straight to completion.
    expect(branchTargets("Observation Accepted?", 0)).toEqual(["Complete Pipeline Run"]);
    expect(branchTargets("Observation Accepted?", 1)).toEqual(["More Priority URLs?"]);
    expect(branchTargets("More Priority URLs?", 0)).toEqual(["Increment Priority Index"]);
    expect(branchTargets("More Priority URLs?", 1)).toEqual(["Fallback Already Used?"]);
    expect(branchTargets("Fallback Already Used?", 0)).toEqual(["Complete Pipeline Run"]);
    expect(branchTargets("Fallback Already Used?", 1)).toEqual(["Mark Fallback Used"]);
    expect(outgoingNodeNames("Mark Fallback Used")).toEqual(["OpenAI Query Generation"]);

    // Once-per-KPI fallback guard: Mark Fallback Used flips the flag, and the
    // Fallback Already Used? gate completes the branch when it is already set.
    expect(findNode("Mark Fallback Used").parameters?.jsCode).toContain("fallbackUsed: true");
    expect(findNode("Fallback Already Used?").parameters).toMatchObject({
      conditions: {
        conditions: [
          {
            leftValue: "={{ $json.fallbackUsed === true }}",
            operator: { type: "boolean", operation: "true" },
          },
        ],
      },
    });
    const morePriorityConditions = findNode("More Priority URLs?").parameters
      ?.conditions as IfConditions;
    expect(morePriorityConditions.conditions?.[0]?.leftValue).toContain("!$json.fallbackUsed");
  });

  it("terminates store-error lanes at branch completion without re-arming fallback", () => {
    // A store-node error is an app failure, not a rejected observation: it must
    // exit through the explicit error output straight to branch completion. When
    // error items ({error} with no status/fallbackUsed) looped back through the
    // fallback gates, `Fallback Already Used?` evaluated false on every lap and
    // fallback re-armed unboundedly (VAL-WO-0010 round 3, Failure 1 / S8).
    for (const storeName of ["Store Raw Document", "Store Observation"]) {
      expect(findNode(storeName).onError, storeName).toBe("continueErrorOutput");
      expect(branchTargets(storeName, 1), storeName).toEqual(["Store Error Context"]);
    }
    expect(branchTargets("Store Raw Document", 0)).toEqual(["New Document?"]);
    expect(branchTargets("Store Observation", 0)).toEqual(["Observation Accepted?"]);

    // The error lane goes only to completion — never back into the fallback
    // gates — and rehydrates runId/branchKey from a lineage-safe back-reference
    // so the completion call can still release the branch.
    expect(outgoingNodeNames("Store Error Context")).toEqual(["Complete Pipeline Run"]);
    expect(findNode("Store Error Context").parameters?.jsCode).toContain(
      "contextFrom('Priority URLs First')",
    );
  });

  it("uses the app raw-document endpoint as the document budget authority", () => {
    expect(nodeNames()).not.toContain("Apply Document Budget");
    expect(JSON.stringify(workflow.nodes)).not.toContain("documentsProcessed");
    expect(outgoingNodeNames("Expand Priority URLs")).toEqual(["Has URL?"]);
    expect(outgoingNodeNames("Expand Filtered URLs")).toEqual(["Has URL?"]);
    expect(findNode("Store Raw Document").parameters?.jsonBody).toContain('"runId"');
    expect(findNode("Store Raw Document").parameters?.jsonBody).toContain('"branchKey"');
  });

  it("routes malformed terminal paths to branch completion", () => {
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

function branchTargets(name: string, outputIndex: number) {
  const connection = workflow.connections[name] as
    { main?: Array<Array<{ node: string }>> } | undefined;

  return connection?.main?.[outputIndex]?.map((target) => target.node) ?? [];
}

function readJson<T = unknown>(path: string): T {
  return JSON.parse(readFileSync(join(rootDir, path), "utf8")) as T;
}
