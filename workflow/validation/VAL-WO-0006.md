---
id: VAL-WO-0006
work-order: WO-0006
date: 2026-08-05
result: fail
---

# Validation: WO-0006 (re-validation)

Re-validated after fix commit `e474872` by a session that did not implement the work order. Three of the four original failures are confirmed fixed by graph inspection; one narrow residual defect remains in the document budget, so the result is fail — but the remaining fix is a one-liner.

## Original failures — status after fix

| Original failure | Status | Evidence |
|---|---|---|
| 1. Infinite fallback cycle | **fixed** | `Mark Fallback Used` sets `fallbackUsed: true` before query generation; `Expand Filtered URLs` stamps all fallback items `fallbackUsed: true`; `More Priority URLs?` requires `sourceType === 'priority' && !fallbackUsed`, so a failed fallback item routes to `Fallback Already Used?` → true → `Complete Pipeline Run`. Fallback runs at most once per KPI; no cycle remains |
| 2. Lock deadlock on zero-item runs | **fixed** | All validators now emit terminal items (`terminalReason`) instead of empty arrays; new `Has URL?`/`Has Raw Text?`/`Has * JSON?` gates route every dead end to `More Priority URLs?` or `Complete Pipeline Run`. Every path through the graph terminates at Complete, so the lock is always released by the run that holds it |
| 3. N2.AC1 ≤10 documents/hour | **partially fixed — residual defect below** | `Apply Document Budget` now exists between URL expansion and fetching, admits `10 - start` items per wave, and emits `document-budget-exhausted` terminals |
| 4. R1.AC2 fallback despite priority success | **fixed** | Priority URLs now process sequentially (one URL per pass via `priorityIndex` + `Increment Priority Index`); a stored, relevant, extracted observation goes `Store Observation → Complete` and never reaches the fallback branch. Fallback only triggers after priority URLs are exhausted without a valid observation (also satisfies R1.AC3) |

All other criteria from the original validation table (R2, R3, R4, R5/R6, R7/R8, R9/R10/R11, N1, N2.AC2/AC3, ingestion API auth, registry, secrets) remain pass; `npm run lint` clean, `npm test` 62/62 across 18 files, workflow JSON parses, and the export test now also asserts the budget node, fallback guard, and terminal-path wiring.

## Failures

1. **BRD-0002.N2.AC1 residual: the document budget leaks across execution waves.** `Apply Document Budget` reads the running count from `items[0]` (`const start = Number(items[0]?.json?.documentsProcessed ?? 0)`). Items in a wave carry different counts, and `items[0]` has the lowest. Concrete trace with 10 KPIs whose priority URLs all yield duplicates: wave 1 admits 10 fetches (counts 1..10); the loop re-enters with those items, `start = 1`, so wave 2 admits 9 more (total 19); subsequent waves admit 8, 7, 6 — up to **40 fetched documents in one hourly run** against the AC's cap of 10. Fix is one line: derive `start` from the maximum incoming count (`Math.max(0, ...items.map((item) => Number(item.json.documentsProcessed ?? 0)))`) — or keep the count in n8n workflow static data instead of item JSON.

## Drift observed
- `Complete Pipeline Run` executes as soon as the first terminal item reaches it, releasing the lock while other KPI branches may still be processing. Release is idempotent and BRD-0001.R6.AC4 only requires release on completion, so this is not an AC violation — but a subsequent hourly tick could then overlap with the tail of the previous run. Worth a cheap guard later (e.g. complete only after a merge/wait node) or a recorded decision that overlap is acceptable.
- If the n8n process itself crashes mid-run, the lock stays held until the next successful manual release — inherent to the design; operational note only.

## Result
Work order returned to `in-progress`. Only failure 1 (budget leak) blocks re-validation; everything else is confirmed fixed.
