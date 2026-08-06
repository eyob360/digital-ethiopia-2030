// Generates the `jsCode` of the n8n workflow's "Validate * JSON" Code nodes
// from the canonical TypeScript contract validators (UNIT-0040,
// src/lib/integration/external-contracts.ts). The workflow JSON never
// hand-maintains validator logic: `npm run n8n:generate` rewrites the three
// nodes in place, and src/lib/n8n/workflow-export.test.ts asserts the
// committed JSON matches this generator byte-for-byte.
//
// Only the transpiled bodies of the validator functions (plus their helper
// dependencies) are embedded, so the strict rules in external-contracts.ts are
// the single source of truth for both the app endpoints and the n8n runtime.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const workflowPath = join(rootDir, "n8n", "workflows", "digital-ethiopia-ingestion.json");

// Files whose top-level functions form the embeddable pool. Order defines the
// stable emit order of embedded helpers.
const contractSourcePaths = ["src/lib/strings.ts", "src/lib/integration/external-contracts.ts"];

const generatedHeader =
  "// GENERATED from src/lib/integration/external-contracts.ts by src/lib/n8n/validator-codegen.mjs" +
  "\n// Do not edit by hand - run `npm run n8n:generate` after changing the contract validators.";

const openAiResponseText =
  "const text = $json.output_text ?? $json.choices?.[0]?.message?.content ?? '';";

const validatorNodes = {
  "Validate Relevance JSON": {
    nodeId: "validate-relevance-json",
    entryFunctions: ["parseOpenAiRelevance"],
    glue: [
      "const context = $('Store Raw Document').item.json;",
      openAiResponseText,
      "let parsed;",
      "try { parsed = typeof text === 'string' ? JSON.parse(text) : text; } catch { return [{ json: { ...context, terminalReason: 'invalid-relevance-json' } }]; }",
      "const relevance = parseOpenAiRelevance(parsed);",
      "if (!relevance) return [{ json: { ...context, terminalReason: 'invalid-relevance-json' } }];",
      "return [{ json: { ...context, relevance } }];",
    ],
  },
  "Validate Extraction JSON": {
    nodeId: "validate-extraction-json",
    entryFunctions: ["parseOpenAiExtraction"],
    glue: [
      "const context = $('Store Raw Document').item.json;",
      openAiResponseText,
      "let parsed;",
      "try { parsed = typeof text === 'string' ? JSON.parse(text) : text; } catch { return [{ json: { ...context, terminalReason: 'invalid-extraction-json' } }]; }",
      "const extraction = parseOpenAiExtraction(parsed);",
      "if (!extraction) return [{ json: { ...context, terminalReason: 'invalid-extraction-json' } }];",
      "return [{ json: { runId: context.runId, branchKey: context.branchKey, kpiId: context.kpi.id, rawDocumentId: context.rawDocument.id, value: extraction.value_numeric, unit: extraction.unit, region: extraction.region, observedDate: extraction.observed_date, sourceUrl: context.rawDocument.sourceUrl, aiConfidence: extraction.confidence, explanation: extraction.explanation, fallbackUsed: context.fallbackUsed, sourceType: context.sourceType, candidateUrls: context.candidateUrls, priorityIndex: context.priorityIndex } }];",
    ],
  },
  "Validate Query JSON": {
    nodeId: "validate-query-json",
    entryFunctions: ["parseOpenAiQueryGeneration"],
    glue: [
      "function contextFrom(nodeName) { try { return $(nodeName).item.json ?? {}; } catch { return {}; } }",
      "const markedContext = contextFrom('Mark Fallback Used');",
      "const initialContext = contextFrom('Priority URLs First');",
      "const context = markedContext.runId ? markedContext : { ...initialContext, fallbackUsed: true };",
      openAiResponseText,
      "let parsed;",
      "try { parsed = typeof text === 'string' ? JSON.parse(text) : text; } catch { return [{ json: { ...context, terminalReason: 'invalid-query-json' } }]; }",
      "const generation = parseOpenAiQueryGeneration(parsed);",
      "const queries = generation ? generation.queries.slice(0, 5) : [];",
      "if (queries.length < 3) return [{ json: { ...context, terminalReason: 'invalid-query-json' } }];",
      "return [{ json: { ...context, queries } }];",
    ],
  },
};

export const validatorNodeNames = Object.keys(validatorNodes);

export function buildValidatorNodeCode(nodeName) {
  const definition = validatorNodes[nodeName];
  if (!definition) {
    throw new Error(`Unknown validator node: ${nodeName}`);
  }

  const pool = loadFunctionPool();
  const embedded = collectEmbeddedFunctions(pool, definition.entryFunctions);

  return [generatedHeader, ...embedded, ...definition.glue].join("\n");
}

export function writeWorkflowValidators() {
  let raw = readFileSync(workflowPath, "utf8");

  for (const [nodeName, definition] of Object.entries(validatorNodes)) {
    raw = replaceNodeJsCode(raw, definition.nodeId, buildValidatorNodeCode(nodeName));
  }

  writeFileSync(workflowPath, raw);
  return workflowPath;
}

function loadFunctionPool() {
  const pool = new Map();

  for (const sourcePath of contractSourcePaths) {
    const sourceText = readFileSync(join(rootDir, sourcePath), "utf8");
    const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true);

    for (const statement of sourceFile.statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        pool.set(statement.name.text, transpileFunction(statement.getText(sourceFile)));
      }
    }
  }

  return pool;
}

function collectEmbeddedFunctions(pool, entryFunctions) {
  const needed = new Set();
  const queue = [...entryFunctions];

  while (queue.length) {
    const name = queue.shift();
    if (needed.has(name)) {
      continue;
    }
    if (!pool.has(name)) {
      throw new Error(`Validator function not found in contract sources: ${name}`);
    }

    needed.add(name);
    for (const [candidate] of pool) {
      if (candidate !== name && new RegExp(`\\b${candidate}\\b`).test(pool.get(name))) {
        queue.push(candidate);
      }
    }
  }

  // Emit in stable source order so regeneration is deterministic.
  return [...pool.keys()].filter((name) => needed.has(name)).map((name) => pool.get(name));
}

function transpileFunction(functionText) {
  const output = ts.transpileModule(functionText, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;

  return output
    .replace(/^"use strict";\s*/, "")
    .replace(/^export /, "")
    .trimEnd();
}

function replaceNodeJsCode(raw, nodeId, code) {
  // The workflow export keeps each Code node as `"jsCode": "..."` immediately
  // before its `"id"`; replace only that string so the rest of the committed
  // JSON stays byte-identical.
  const pattern = new RegExp(
    `("jsCode": )"(?:[^"\\\\]|\\\\.)*"(\\s*\\},\\s*"id": "${nodeId}")`,
    "s",
  );

  if (!pattern.test(raw)) {
    throw new Error(`Could not locate jsCode for workflow node id: ${nodeId}`);
  }

  return raw.replace(pattern, (_match, prefix, suffix) => `${prefix}${JSON.stringify(code)}${suffix}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = writeWorkflowValidators();
  console.log(`Regenerated validator nodes in ${path}`);
}
