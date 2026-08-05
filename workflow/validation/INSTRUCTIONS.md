# Validation — Instructions

Validation closes the loop: it checks that a completed work order actually satisfies its requirements. Prefer a **fresh agent session** (or different agent) than the one that implemented — implementers grade themselves too kindly.

## Process

For a work order with status `done` (for maintenance WOs — `implements: none` — verify the testing plan and summary objective instead of ACs):

1. Re-read the work order and each acceptance criterion it implements.
2. Verify each criterion against the actual code and by running the testing plan. Cite evidence (file, test, or observed behavior) per criterion.
3. Check for drift: does the implementation contradict the BRD, blueprint, or any decision cited in the work order? If so, report to the user — don't silently fix either side.
4. Write a report from the template below, saved in this folder as `VAL-WO-XXXX.md` (one report per work order — on re-validation, update the same file with the new date and result). If everything passes: set the WO to `validated`, update `../STATE.md`, and when all of a BRD's requirements are validated, update the BRD's status too.
5. If anything fails: list failures in the report, set the WO back to `in-progress`, and note it in STATE.md.

## Drift audits

A periodic whole-project check that code still matches approved BRDs and blueprints, catching drift that accumulates outside validations (human commits, trivial fixes, refactors).

1. Read the `Last drift audit` line in `../STATE.md`; review changes since that commit (`git log <hash>..HEAD`, diffs of affected areas).
2. Compare changed code against the BRDs/blueprints covering it. List contradictions — report them to the user; never silently fix either side. Also check registry entries still point at real paths.
3. Structural sweep of the workflow files themselves: every ID unique; every `implements:`/`depends-on:`/`blueprint:` target exists; every item file has an index line and the statuses agree (mismatch → reconcile from evidence per AGENTS.md rule 3); no work order without an approved BRD (except maintenance).
4. Save a report as `DRIFT-NNNN.md` in this folder (findings + affected doc IDs), and update the `Last drift audit` line with the new commit hash and date.

Run one when the user asks, or offer one when the last audit is stale (see AGENTS.md "What to do next"). Projects may additionally wire this procedure into CI — same steps, same reports.

## Template

```markdown
---
id: VAL-WO-0001
work-order: WO-0001
date: YYYY-MM-DD
result: pass | fail
---

# Validation: WO-0001

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0001.R1.AC1 | pass | test_x, src/y.py:42 |

## Drift observed
None, or what contradicts which doc.

## Failures
None, or what must be fixed.
```
