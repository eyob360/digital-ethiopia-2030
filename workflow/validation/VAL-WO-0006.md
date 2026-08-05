---
id: VAL-WO-0006
work-order: WO-0006
date: 2026-08-05
result: fail
---

# Validation: WO-0006

Validated by a session that did not implement the work order. Code-level checks pass (lint clean, 61/61 tests, build registers all 6 ingestion routes, schema valid, workflow JSON parses). The app-side services and ingestion API boundary are solid. The failures below are structural defects in the n8n workflow graph itself (`n8n/workflows/digital-ethiopia-ingestion.json`), established by inspecting its nodes, IF conditions, and connection graph — the export test validates node presence, retries, and connection existence but not loop-safety, document caps, or completion reachability.

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0002.R1.AC1/AC3 (priority first, fallback after) | pass | `Priority URLs First` seeds `candidateUrls` from `kpi.sourceUrls` (≤5); `Has Priority URLs?` routes empty lists to `OpenAI Query Generation`; duplicate/irrelevant documents fall back per-item |
| BRD-0002.R1.AC2 (no fallback when priority succeeded) | **fail** | Branches are per-URL with no per-KPI aggregation: if one priority URL yields a valid observation but a sibling URL is duplicate or irrelevant, the sibling still triggers fallback search for that KPI in the same run |
| BRD-0002.R2 (query generation) | pass | OpenAI node prompts strict JSON `{"queries": string[]}` (3–5); `Validate Query JSON` drops invalid JSON and out-of-range counts |
| BRD-0002.R3 (provider abstraction) | pass | App-side `SearchProvider` interface with `TavilySearchProvider` (D-0007); n8n calls `/api/ingestion/search`, so provider swap needs no KPI/workflow changes; missing key → `SearchProviderConfigError` → clear 500 (unit-tested) |
| BRD-0002.R4 (URL controls) | pass | `/api/ingestion/url-filter` applies WO-0003 `filterCandidateUrls` (dedupe, block/allow lists, ≤5 cap); both expand nodes slice to 5 |
| BRD-0002.R5/R6 (fetch, hash-first storage, dedupe) | pass | `Extract Readable Text` strips script/style/tags; `/api/ingestion/raw-documents` → `storeRawDocumentIfNew` hashes before storing, returns `duplicate` without a new row (unit-tested); `New Document?` stops the branch before relevance on duplicates; fetch nodes `onError=continueRegularOutput` so failed URLs don't halt other KPIs |
| BRD-0002.R7/R8 (relevance gate, strict extraction) | pass | Strict-JSON prompts; `Validate Relevance JSON` requires boolean `relevant` + numeric `confidence`; `Validate Extraction JSON` requires all six fields; normalization and confidence thresholds run server-side in `appendAcceptedObservation` (R8.AC4) |
| BRD-0002.R9/R10/R11 (normalization, confidence gate, append-only) | pass | Delegated to the validated WO-0003/WO-0004 helpers via `/api/ingestion/observations`; re-verified by unit tests |
| BRD-0002.N1 (retries) | pass | All 10 external/database-backed nodes: `retryOnFail`, `maxTries: 5`, `waitBetweenTries: 2000`; node-level so earlier successes don't rerun |
| BRD-0002.N2.AC1 (≤10 documents/hour) | **fail** | No document counter exists anywhere in the workflow or app. The hourly run processes up to 10 KPIs × 5 URLs = up to 50 documents/hour by design — and unbounded with the fallback cycle below. The README's cost-control section documents the 10-KPI and 5-URL caps but nothing enforces the explicit 10-documents/hour AC |
| BRD-0002.N2.AC2/AC3 (≤5 URLs/KPI, no heavy infra) | pass | Slice-to-5 in both expand nodes + filter cap; no vector DB/queue/warehouse/streaming introduced |
| Ingestion API auth | pass | All 6 `/api/ingestion/*` routes require `Bearer INGESTION_API_KEY` (fail-closed 500 when unconfigured, 401 on mismatch; unit-tested); excluded from session middleware in `src/proxy.ts` |
| Registry / secrets | pass | UNIT-0035 … UNIT-0039 registered; no secrets committed (`.env.example` placeholder, compose passes through env) |

## Failures

1. **Infinite fallback cycle (cost/runaway risk).** `New Document?` = duplicate and `Relevant?` = false both route back to `OpenAI Query Generation`, and no flag marks a branch as having already used fallback. The cycle `Query Generation → Tavily → Filter → Fetch → Store Raw → duplicate → Query Generation` is deterministic: the same KPI produces the same queries, the same URLs, the same content hash, and loops forever, burning OpenAI and Tavily credits on every iteration. No workflow timeout is configured to stop it. Fix: set a `fallbackUsed` flag when entering the fallback branch and route duplicate/irrelevant fallback items to `Complete Pipeline Run` (or a per-KPI dead end) instead of back to query generation.
2. **Pipeline lock deadlock when no branch survives.** `Complete Pipeline Run` only executes if at least one item reaches it through `Store Observation`. If every branch dies in a zero-item code node (`Validate * JSON` returning `[]`, `Expand Filtered URLs` with an empty filtered list — plausible whenever Tavily results are all off-allow-list, or Tavily is unconfigured), the lock is never released. Every subsequent hourly run then gets `started: false` at `Run Started?`, whose false branch is a dead end — a permanent stall requiring manual lock release. This is exactly the failure path flagged for this WO in VAL-WO-0004. The README's claim that "the final node always calls complete after processing" does not hold in this case. Fix: route the `Run Started?` false branch and all dead-end paths to completion, or make release unconditional (e.g. an error-workflow / final merge node that always calls `action=complete`).
3. **BRD-0002.N2.AC1 not implemented.** Nothing limits processing to 10 documents per hour (see table). Fix: enforce a per-run document counter (app-side counter on `/api/ingestion/raw-documents` per run, or a workflow-level cap), or — if the 10-KPI batch is the intended interpretation of the AC — get a user decision and update the BRD wording.
4. **BRD-0002.R1.AC2 partial.** No per-KPI "priority succeeded" coordination before falling back (see table). Lower severity than 1–3; may be acceptable if the user deems per-URL fallback acceptable — needs either a fix or a recorded decision.

## Drift observed
- The WO-0004 note about mid-flight lock failure was partially addressed (server now auto-releases on empty batch; node errors continue through the graph) but the zero-surviving-item path (failure 2) remains.
- `Fetch Priority URL` is also used for fallback URLs (naming only; no behavioral issue).

## Result
Work order returned to `in-progress`. Failures 1–3 must be fixed (or decision-resolved) before re-validation; failure 4 needs a fix or a recorded user decision.

## Resolution note
Implementation follow-up on the WO-0006 branch addressed the reported graph failures: fallback now uses `fallbackUsed` and cannot loop, malformed/empty terminal paths route to completion, `Apply Document Budget` enforces the 10-document hourly cap, and priority URLs are attempted sequentially so a stored priority observation prevents fallback for that KPI. Awaiting fresh re-validation; this report's `result: fail` remains the original validation outcome until then.
