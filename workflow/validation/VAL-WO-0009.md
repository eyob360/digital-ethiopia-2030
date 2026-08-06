---
id: VAL-WO-0009
work-order: WO-0009
date: 2026-08-06
result: pass
---

# Validation: WO-0009

Validated in a fresh session (implementer session was separate). Static suite: `npm run lint`, `npm test` (19 files / 74 tests), `npm run build`, `npx prisma validate` — all pass on `wo-0009-pipeline-lock-and-budget-fix` (b1eb5a7). Live checks executed against local Docker Postgres with migrations `0001`–`0003` applied, via a temporary vitest harness driving the real service functions (`startPipelineRun`, `completePipelineRunBranch`, `reservePipelineDocumentSlot`, `storeRawDocumentIfNew`) against the real database (harness deleted after the run; results below).

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0001.R6.AC1 (check lock before processing) | pass | Live: second `startPipelineRun` while a run is active returns `started: false` with zero KPIs loaded. Unit: `src/server/pipeline.test.ts:349` asserts `kpiDefinition.findMany` is never called when acquisition fails. |
| BRD-0001.R6.AC2 (locked → stop before loading KPIs) | pass | Same live check: blocked start at +30 min loads no KPIs. Unit: `src/server/pipeline.test.ts:100,349`. |
| BRD-0001.R6.AC3 (unlocked → set lock before continuing) | pass | Live: `startPipelineRun` acquires atomically (`updateMany` fenced on `locked: false` / stale) before `loadEligibleKpisForPipeline`; unit `src/server/pipeline.test.ts:258` asserts acquire-before-load ordering. Code: `src/server/pipeline.ts:49-67,138`. |
| BRD-0001.R6.AC4 (release when the *run* completes) | pass | Live: with 3 branches, first branch completion returns `released: false` and the lock stays held with `documentsProcessed` intact (the old bug zeroed it here); duplicate completion of the same branch key is a no-op; a completion carrying a wrong `runId` is fenced; the two remaining branches completed **concurrently** release exactly once, leaving `locked: false`, `runId: null`, counters zeroed. Unit: `src/server/pipeline.test.ts:139,179`. Code: `src/server/pipeline.ts:93-131,184-199`. |
| BRD-0002.N2.AC1 (≤10 documents per hourly run) | pass | Live: 15 concurrent `reservePipelineDocumentSlot` calls against real Postgres → exactly 10 granted; after an early branch completion, slot 11 is still refused and `storeRawDocumentIfNew` returns `budget_exhausted` (counter no longer reset mid-run). Dead n8n guard removed: export test `src/lib/n8n/workflow-export.test.ts` asserts no `Apply Document Budget` node and no `documentsProcessed` reference remains; the DB counter is the sole authority. |
| BRD-0002.N2.AC2 (≤5 URLs per KPI) | pass (unchanged) | Untouched by this WO; candidate-URL cap logic and its tests unchanged on this branch (validated in VAL-WO-0003/0006). |
| BRD-0002.N2.AC3 (no forbidden infrastructure) | pass (by inspection) | Diff adds only columns on `pipeline_locks` plus an env var — no new dependencies, services, or paid APIs (`git diff main..HEAD --stat`). |
| Stale-lock recovery (in-scope design item) | pass | Live crash simulation (run started, branches never report — the DB-observable effect of killing n8n mid-run): re-acquire at +119 min refused, next start at +121 min acquires with a fresh `runId` and zeroed budget; a zombie completion from the crashed run cannot touch the new run. Unit: `src/server/pipeline.test.ts:74`. Config: `PIPELINE_LOCK_STALE_AFTER_MINUTES` (default 120) in `.env.example`, `n8n/README.md`. |

## Drift observed

None. The design matches D-0017's rework mandate; no recorded decision is contradicted; no new dependencies (D-0016 tree untouched). Registry entries UNIT-0019/0036/0039 were extended, not duplicated, and describe the code accurately.

Notes (not failures):
- Full n8n end-to-end execution (real workflow driving the endpoints with live OpenAI/Tavily keys) was not run — no API keys in this environment. The workflow's branch-completion wiring (`runId`/`branchKey` from `Expand KPI Batch` through `Complete Pipeline Run`, terminal paths routed to completion) is covered by the executed export tests; the app-side semantics those paths hit have live executed evidence above. A branch that never reports (n8n crash) is exactly the recovery path exercised live.
- A budget-exhausted branch continues fetching its remaining priority URLs (each store refused) before terminating — wasteful but bounded at 5 URLs/KPI; fetch-vs-store ordering was not in scope.
- `src/app/api/pipeline/runs/route.ts` and `src/app/api/ingestion/pipeline/runs/route.ts` remain near-identical (now including a duplicated `asNonEmptyString` helper). Pre-existing mirror structure; consolidation belongs to WO-0013.

## Failures

None.

**Merge hold:** WO-0009 is flagged sensitive (pipeline lock/budget data integrity) — per conventions the branch awaits user review before merge despite the validation pass.
