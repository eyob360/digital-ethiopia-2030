import { describe, expect, it } from "vitest";
import { buildValidatorNodeCode } from "./validator-codegen.mjs";

// Executes the generated Code-node source the way n8n does: `$json` is the
// incoming item and `$('Node Name')` resolves earlier node output (throwing
// for nodes that did not run on the current lineage). This proves the single
// validation path — generated from external-contracts.ts — rejects malformed
// AI output under the strict rules, not the weaker hand-written checks it
// replaced (WO-0013).
function runValidatorNode(
  nodeName: string,
  options: { json: unknown; nodes?: Record<string, unknown> },
) {
  const nodes = options.nodes ?? {};
  const resolveNode = (name: string) => {
    if (!(name in nodes)) {
      throw new Error(`No data for node: ${name}`);
    }

    return { item: { json: nodes[name] } };
  };

  const run = new Function("$json", "$", buildValidatorNodeCode(nodeName)) as (
    json: unknown,
    resolve: typeof resolveNode,
  ) => Array<{ json: Record<string, unknown> }>;

  return run(options.json, resolveNode);
}

const storeContext = {
  runId: "run-1",
  branchKey: "kpi-1",
  kpi: { id: "kpi-1", name: "Internet penetration" },
  rawDocument: { id: "raw-1", sourceUrl: "https://statsethiopia.gov.et/report", rawText: "text" },
  fallbackUsed: false,
  sourceType: "priority",
  candidateUrls: ["https://statsethiopia.gov.et/report"],
  priorityIndex: 0,
};

function openAiText(payload: unknown) {
  return { output_text: JSON.stringify(payload) };
}

describe("generated relevance validator node", () => {
  it("rejects out-of-range or malformed relevance output under the strict contract", () => {
    const cases: unknown[] = [
      { relevant: true, confidence: 1.2 },
      { relevant: true, confidence: 85 },
      { relevant: true, confidence: "0.9" },
      { relevant: "yes", confidence: 0.9 },
      { confidence: 0.9 },
    ];

    for (const payload of cases) {
      expect(
        runValidatorNode("Validate Relevance JSON", {
          json: openAiText(payload),
          nodes: { "Store Raw Document": storeContext },
        }),
        JSON.stringify(payload),
      ).toEqual([{ json: { ...storeContext, terminalReason: "invalid-relevance-json" } }]);
    }

    expect(
      runValidatorNode("Validate Relevance JSON", {
        json: { output_text: "not json at all" },
        nodes: { "Store Raw Document": storeContext },
      }),
    ).toEqual([{ json: { ...storeContext, terminalReason: "invalid-relevance-json" } }]);
  });

  it("accepts valid relevance output and rehydrates the store context", () => {
    expect(
      runValidatorNode("Validate Relevance JSON", {
        json: { choices: [{ message: { content: '{"relevant": true, "confidence": 0.8}' } }] },
        nodes: { "Store Raw Document": storeContext },
      }),
    ).toEqual([{ json: { ...storeContext, relevance: { confidence: 0.8, relevant: true } } }]);
  });
});

describe("generated extraction validator node", () => {
  const validExtraction = {
    value_numeric: 42.5,
    unit: "percent",
    region: "Ethiopia",
    observed_date: "2026-08-01",
    explanation: "Reported by the statistics service",
    confidence: 0.9,
  };

  it("rejects extraction output that only passed the old key-presence check", () => {
    const cases: unknown[] = [
      { ...validExtraction, region: "" },
      { ...validExtraction, observed_date: "August 1, 2026" },
      { ...validExtraction, confidence: 85 },
      { ...validExtraction, value_numeric: "42.5" },
      { ...validExtraction, explanation: "   " },
    ];

    for (const payload of cases) {
      expect(
        runValidatorNode("Validate Extraction JSON", {
          json: openAiText(payload),
          nodes: { "Store Raw Document": storeContext },
        }),
        JSON.stringify(payload),
      ).toEqual([{ json: { ...storeContext, terminalReason: "invalid-extraction-json" } }]);
    }
  });

  it("maps valid extraction output to the observation payload with branch context", () => {
    expect(
      runValidatorNode("Validate Extraction JSON", {
        json: openAiText(validExtraction),
        nodes: { "Store Raw Document": storeContext },
      }),
    ).toEqual([
      {
        json: {
          runId: "run-1",
          branchKey: "kpi-1",
          kpiId: "kpi-1",
          rawDocumentId: "raw-1",
          value: 42.5,
          unit: "percent",
          region: "Ethiopia",
          observedDate: "2026-08-01",
          sourceUrl: "https://statsethiopia.gov.et/report",
          aiConfidence: 0.9,
          explanation: "Reported by the statistics service",
          fallbackUsed: false,
          sourceType: "priority",
          candidateUrls: ["https://statsethiopia.gov.et/report"],
          priorityIndex: 0,
        },
      },
    ]);
  });
});

describe("generated query validator node", () => {
  const fallbackContext = { runId: "run-1", branchKey: "kpi-1", fallbackUsed: true };

  it("rejects fewer than three usable queries", () => {
    for (const payload of [
      { queries: ["one", "two"] },
      { queries: ["one", "  ", 5, "two"] },
      { queries: "not-an-array" },
      {},
    ]) {
      expect(
        runValidatorNode("Validate Query JSON", {
          json: openAiText(payload),
          nodes: { "Mark Fallback Used": fallbackContext },
        }),
        JSON.stringify(payload),
      ).toEqual([{ json: { ...fallbackContext, terminalReason: "invalid-query-json" } }]);
    }
  });

  it("trims, filters, and caps valid queries at five", () => {
    expect(
      runValidatorNode("Validate Query JSON", {
        json: openAiText({ queries: [" q1 ", "q2", "q3", "q4", "q5", "q6", "q7"] }),
        nodes: { "Mark Fallback Used": fallbackContext },
      }),
    ).toEqual([{ json: { ...fallbackContext, queries: ["q1", "q2", "q3", "q4", "q5"] } }]);
  });

  it("falls back to the initial branch context on direct-fallback lineages", () => {
    // `Mark Fallback Used` never ran (KPI without priority URLs): contextFrom
    // must swallow the lookup error and rebuild from `Priority URLs First`.
    const initialContext = { runId: "run-1", branchKey: "kpi-1", fallbackUsed: false };

    expect(
      runValidatorNode("Validate Query JSON", {
        json: openAiText({ queries: ["q1", "q2", "q3"] }),
        nodes: { "Priority URLs First": initialContext },
      }),
    ).toEqual([{ json: { ...initialContext, fallbackUsed: true, queries: ["q1", "q2", "q3"] } }]);
  });
});
