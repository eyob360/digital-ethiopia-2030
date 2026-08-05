---
id: VAL-WO-0006
work-order: WO-0006
date: 2026-08-05
result: pass
---

# Validation: WO-0006 (re-validation 3 — pass)

Re-validated after fix commit `38b95ed` by a session that did not implement the work order. Both residual failures from re-validation 2 are fixed; the N2.AC1 document cap was verified live against local Docker PostgreSQL and a production build on port 3100 (test documents removed afterwards; DB left clean).

## Final fix verification

| Prior failure | Status | Evidence |
|---|---|---|
| Budget-exhausted terminal items entered the fetch pipeline | **fixed** | Terminal item now sets `url: null`; `Has URL?` routes it to `Complete Pipeline Run` — no fetch, no AI calls |
| Item-carried counter couldn't span parallel lineages | **fixed** | Global cap moved app-side: `PipelineLock.documentsProcessed` (migration `0002_pipeline_document_counter`) with `reservePipelineDocumentSlot` — an atomic conditional increment (`locked: true AND documentsProcessed < 10`) consulted by `storeRawDocumentIfNew` before any store. Counter resets on acquire and release |

Live N2.AC1 verification during an active run: documents 1–10 → `stored`; document 11 → `budget_exhausted` with no row created; storing outside a run (lock not held) → `budget_exhausted` (fail-closed); `action=complete` releases the lock and resets the counter to 0. The cap is authoritative regardless of n8n execution semantics — any lineage, any wave, any parallel branch hits the same database counter.

## Cumulative results (all re-validations)

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0002.R1 (priority first; no fallback after success; fallback once) | pass | Sequential priority URLs via `priorityIndex`; success ends branch at `Store Observation → Complete`; `fallbackUsed` guard limits fallback to once per KPI |
| BRD-0002.R2/R7/R8 (strict-JSON AI stages) | pass | Strict prompts; validators reject malformed output via terminal items; normalization/thresholds stay server-side (R8.AC4) |
| BRD-0002.R3 (provider abstraction) | pass | `SearchProvider` interface + `TavilySearchProvider` (D-0007); config error fail-closed; swap requires no KPI changes |
| BRD-0002.R4 (URL controls) | pass | WO-0003 `filterCandidateUrls` via `/api/ingestion/url-filter`; ≤5 URLs enforced at expansion and filtering |
| BRD-0002.R5/R6 (fetch, hash-first, dedupe) | pass | Readable-text extraction; hash-before-store; duplicates create no row and stop before relevance (D-0009) |
| BRD-0002.R9/R10/R11 | pass | Delegated to validated WO-0003/WO-0004 helpers via ingestion API |
| BRD-0002.N1 (retries) | pass | 10 nodes with `retryOnFail`, 5 tries, 2000ms; node-level |
| BRD-0002.N2.AC1 (≤10 documents/hour) | pass | **Verified live**: 10 stored, 11th refused; DB counter authoritative; n8n `Apply Document Budget` additionally curtails fetch volume |
| BRD-0002.N2.AC2/AC3 | pass | ≤5 URLs/KPI; no heavy infrastructure introduced |
| Lock lifecycle | pass | Every graph path terminates at `Complete Pipeline Run`; empty batch auto-releases server-side; live: start → complete resets lock and counter |
| Ingestion API auth | pass | Live: missing/wrong bearer → 401; all 6 routes guarded; fail-closed 500 when key unconfigured |
| Testing plan | pass | Lint clean; 65/65 tests across 18 files; build succeeds; `prisma validate` valid; migration `0002` applied cleanly to local DB; workflow JSON parses; export test asserts nodes, retries, budget wiring, fallback guard, terminal paths |
| Registry / secrets | pass | UNIT-0035 … UNIT-0039 registered (UNIT-0019/0036 updated for the counter); no secrets committed |

## Drift observed
Non-blocking operational notes, carried forward for WO-0007 (integration hardening) or a future decision:

1. `Complete Pipeline Run` fires on the first terminal item, releasing the lock and resetting the counter while other branches may still be processing — late branches then get `budget_exhausted` on store (conservative: under-processes, never over). A merge/wait node before completion would tighten this.
2. An n8n process crash mid-run leaves the lock held until manual release.
3. After budget exhaustion, fallback branches still incur query-generation and Tavily calls (bounded: ≤1 fallback per KPI, ≤10 KPIs; no relevance/extraction calls since nothing stores).

## Result
Pass. BRD-0002's requirements (R1–R11, N1, N2 across WO-0003/WO-0004/WO-0006) are now all validated.

## Merge status
Review cleared for merge after pass validation; branch ready to land on `main`.
