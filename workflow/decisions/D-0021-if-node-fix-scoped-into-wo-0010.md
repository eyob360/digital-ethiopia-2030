---
id: D-0021
date: 2026-08-06
kind: decision
status: active
relates-to: [WO-0010, WO-0009, BRD-0002]
---

# D-0021: IF-node format fix scoped into WO-0010; WO-0006/WO-0009 statuses stand conditionally

**Question:** VAL-WO-0010 round 2 found a pre-existing runtime defect on `main`: all 12 n8n IF nodes declare `typeVersion: 2` with typeVersion-1 condition parameters, routing every item to the true output. This undermines runtime assumptions behind the validated statuses of WO-0006 (archived) and WO-0009. Roll those statuses back for review, or scope the IF-format fix into the WO-0010 rework?

**Decision:** Scope the IF-format migration (all 12 nodes → proper v2 filter format, proven correct in VAL-WO-0010 Experiment D) into WO-0010's rework. WO-0010's round-3 validation must additionally produce **executed evidence** that the previously-validated IF-dependent behaviors hold once IFs actually branch — specifically `Run Started?` (WO-0009's lock mutual exclusion: a `started: false` response must NOT proceed to `Expand KPI Batch`) and the dedup/relevance/priority branching WO-0006 relied on. WO-0006/WO-0009 statuses stand conditionally on that evidence; if round 3 refutes either, roll that status back for review then. Export tests must also assert condition format matches the declared typeVersion so this defect class is caught statically.

**Why:** Delegated — the user instructed end-to-end orchestration on 2026-08-06 ("pick up work from here to the end, following the workflow rules"). The IF fix is required for WO-0010's AC3 to be reachable regardless of the rollback question, and a single fix plus executed re-verification restores the refuted runtime assumptions without status churn. Rollback remains the fallback if the evidence fails.
