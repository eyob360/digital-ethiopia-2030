---
id: VAL-WO-0006
work-order: WO-0006
date: 2026-08-05
result: fail
---

# Validation: WO-0006 (re-validation 2)

Re-validated after fix commit `1ff1493` by a session that did not implement the work order. The `Math.max` change closes the wave-to-wave counter leak exactly as specified in the previous report, and all previously-fixed items (fallback-once guard, terminal paths to Complete, sequential priority URLs) remain intact. Lint clean, 62/62 tests pass.

Two residual defects keep BRD-0002.N2.AC1 (≤10 documents/hour) unmet. Both are concrete and traceable in the graph; the first is the direct blocker.

## Failures

1. **Budget-exhausted terminal items still enter the fetch pipeline.** `Apply Document Budget`'s exhausted branch returns `{ ...items[0].json, terminalReason: 'document-budget-exhausted', fallbackUsed: true }` — and `items[0].json.url` is non-empty (the loop sets `url` in `Expand Priority URLs` *before* the item reaches the budget node). The budget node's only output goes to `Has URL?`, which checks `url isNotEmpty` → true → `Fetch Priority URL`. So the "terminal" item is fetched, extracted, stored, and (if new) sent through relevance and extraction — one full extra document per exhausted wave, on top of the 10 the budget admitted. Fix: clear `url` (e.g. `url: null`) in the terminal item, or route the exhausted branch directly to `Complete Pipeline Run` instead of `Has URL?`.
2. **Independent lineages don't share the counter.** KPIs without priority `source_urls` skip `Apply Document Budget` (`Has Priority URLs?` false → query generation) and first meet it at `Expand Filtered URLs` — in a separate execution wave whose items carry no `documentsProcessed`. That lineage starts at `start = 0` and gets its own budget of 10, regardless of what the priority lineage consumed. A catalogue mixing priority-URL KPIs and search-only KPIs can reach ~20 fetched documents per hourly run. The item-carried counter cannot express a global per-run budget across parallel lineages. Robust fix: enforce the cap app-side (per-run document counter checked in `/api/ingestion/raw-documents` between `startPipelineRun` and `complete` — authoritative and testable), or hold the counter in n8n workflow static data reset at `Start Pipeline Run`. Alternative: a recorded user decision reinterpreting N2.AC1 as a per-branch budget, if 10-per-lineage is acceptable for MVP cost control.

## Confirmed fixed (cumulative across re-validations)

| Item | Status |
|---|---|
| Infinite fallback cycle | fixed — `fallbackUsed` guard; fallback at most once per KPI |
| Lock deadlock on zero-item runs | fixed — all validators emit terminal items; every path reaches `Complete Pipeline Run` |
| R1.AC2 fallback despite priority success | fixed — sequential priority URLs; success ends the branch before fallback |
| N2.AC1 wave-to-wave counter leak (`items[0]` → max) | fixed by `1ff1493`; verified in `Apply Document Budget` code |

All other criteria (R2–R11, N1, N2.AC2/AC3, ingestion API auth, registry, secrets) remain pass as in the original report.

## Drift observed
- Unchanged from re-validation 1: `Complete Pipeline Run` fires on the first terminal item (lock may release while other branches finish — overlap possible with the next hourly tick), and an n8n process crash mid-run leaves the lock held. Non-blocking; guard or decision recommended.

## Result
Work order returned to `in-progress`. Failure 1 is a small graph edit; failure 2 needs either the app-side counter (recommended) or a recorded decision narrowing the AC.

## Resolution note 3
Implementation follow-up kept N2.AC1 as a strict global cap, cleared `url` on exhausted-budget workflow terminal items, and added an app-side `PipelineLock.documentsProcessed` reservation enforced by `/api/ingestion/raw-documents`. Awaiting fresh re-validation; this report's `result: fail` remains the re-validation outcome until then.
