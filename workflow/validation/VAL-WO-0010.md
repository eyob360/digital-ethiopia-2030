---
id: VAL-WO-0010
work-order: WO-0010
date: 2026-08-06
result: fail
---

# Validation: WO-0010

Validated in a fresh session (implementer session was separate). Static suite on `wo-0010-fallback-search-reachability-fix` (d903408): `npm run lint`, `npm test` (20 files / 76 tests), `npm run build` — all pass. No OpenAI/Tavily keys in this environment, so the full LLM-driven live run could not be executed (same constraint as VAL-WO-0009); instead, the runtime mechanism the fix depends on was tested directly with controlled experiments against the project's pinned n8n (`n8nio/n8n:2.33.0` from `docker-compose.yml`, HTTP Request node typeVersion 4.2 — identical to every HTTP node in the ingestion workflow). Those experiments **refute** the fix's core assumption; details under Failures.

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0002.R1.AC1 (priority URLs checked before fallback) | pass (unchanged) | Export tests assert `Has Priority URLs?` routes to `Expand Priority URLs` before any fallback node (`src/lib/n8n/workflow-export.test.ts`, executed in `npm test`). This segment runs pre-OpenAI, where context is intact. Previously validated; untouched by this WO. |
| BRD-0002.R1.AC2 (valid observation → no fallback same run) | blocked | Guard structure intact: `More Priority URLs?` requires `!$json.fallbackUsed`, `Fallback Already Used?` true-branch → `Complete Pipeline Run`, `Mark Fallback Used` caps fallback at once (export test `routes rejected priority observation candidates toward fallback search`, executed). But at runtime no branch can produce a valid observation at all (see Failures — pre-existing), so the criterion is unexercisable live. |
| BRD-0002.R1.AC3 (no valid observation → continue to fallback) | **fail** | The WO's own layers are sound and executed: `POST /api/ingestion/observations` returns 200 + `status: "rejected"` + echoed routing context (`src/app/api/ingestion/observations/route.test.ts`, executed); `Store Observation → Observation Accepted? → [Complete Pipeline Run | More Priority URLs?]` wiring asserted by executed export tests. But executed n8n experiments (below) prove item context does not survive HTTP Request nodes, and the ingestion workflow has two OpenAI HTTP hops *before* `Store Observation` — `kpiId`/`sourceType`/`candidateUrls`/`priorityIndex`/`fallbackUsed`/`runId`/`branchKey` are all lost before the rejected-candidate case can occur. The testing plan's live check ("observe the run proceed to fallback search and terminate cleanly") cannot pass on this runtime. |

## Executed experiments (repeatable)

Setup: `docker compose up -d`; fresh n8n owner created via `POST /rest/owner/setup` (local creds `validator@local.test` / `Validate-123`); workflows created via `POST /rest/workflows`, activated via `POST /rest/workflows/:id/activate` with the workflow's `versionId`; triggered via their webhook URLs.

1. **Passthrough experiment** — chain: Webhook → Code (emits `{marker, kpi, sourceType, candidateUrls, priorityIndex, fallbackUsed}`) → HTTP Request 4.2 (`GET http://localhost:5678/healthz`) → Code (reports what it sees). Result: downstream sees **only** `{"status":"ok"}` — `markerPresent: false, kpiPresent: false, sourceTypePresent: false`. HTTP Request output *replaces* item JSON; input fields are not merged.
2. **Failure-mode experiment (no onError)** — same chain plus an HTTP node whose `jsonBody` expression reads the lost field (`$json.kpi.name`). Result: execution status `error` — the node kills the branch.
3. **Failure-mode experiment (onError: continueRegularOutput, as on all OpenAI nodes)** — same, with `onError` set. Result: branch continues but the item becomes `{"error": "The value in the \"JSON Body\" field is not valid JSON"}` — context still absent.

## Consequence trace through the real workflow

Context survives app-API hops because the app echoes it (`storeRawDocumentIfNew` / observations route both return `workflowContext` — that echo design is correct). It dies at `OpenAI Relevance Gate` (first OpenAI hop):

- `OpenAI Structured Extraction` reads `$json.kpi.name` → expression error → `onError` emits an error item (experiment 3).
- `Validate Extraction JSON` gets no `output_text` → `terminalReason: invalid-extraction-json` → `Has Extraction JSON?` false → `More Priority URLs?` — `sourceType` lost → false → `Fallback Already Used?` — `fallbackUsed` lost → false → `Mark Fallback Used` → `OpenAI Query Generation` reads lost `$json.kpi.name` → error item → `Validate Query JSON` → terminal → `Complete Pipeline Run`, whose `jsonBody` reads lost `runId`/`branchKey` → the completion POST cannot be built (experiment 3's exact error).
- Net: any branch that reaches the relevance gate becomes a zombie — no observation ever stored, fallback runs without KPI context, branch completion never reported, lock held until WO-0009's 120-minute stale expiry on **every** run.

## Drift observed

- **Pre-existing runtime defect, not introduced by WO-0010**: `Validate Extraction JSON` has read `$json.runId` / `$json.kpi.id` / `$json.rawDocument.id` after an OpenAI hop since before this WO; `main` has the same shape. BRD-0002.R1/R2 ingestion behavior is therefore broken at runtime on `main` as well — undetected because no validation has ever executed the n8n workflow end-to-end (noted in VAL-WO-0006/VAL-WO-0009). Reported to the user rather than fixed silently.
- No recorded decision contradicted (the 200-with-`status` contract is one of the two approaches WO-0010 explicitly allowed; D-0007/D-0008 untouched).
- No duplication: UNIT-0038/UNIT-0039 extended in place; the new `Observation Accepted?` node and `parseRoutingContext` helper are within existing units.

## Failures

1. **BRD-0002.R1.AC3 not achieved at runtime.** The rejected-candidate → fallback path depends on `sourceType`/`candidateUrls`/`priorityIndex`/`fallbackUsed` (and `kpi`, `runId`, `branchKey`) reaching `Validate Extraction JSON` and `Store Observation`, but all are destroyed at the first OpenAI HTTP hop (experiments 1–3). Fix direction (for the rework, not mandated): rehydrate context after each OpenAI hop with n8n back-references (e.g. `$('Store Raw Document').item.json`) or a Merge/Set pattern, then re-validate with a live run — the passthrough experiment workflow in this report can be reused to verify the chosen pattern before touching the ingestion workflow.

WO-0010 set back to `in-progress`.
