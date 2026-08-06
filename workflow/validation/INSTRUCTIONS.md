# Validation — Instructions

Validation closes the loop — and its stance is **refutation, not confirmation**: your job is to try to make the work fail, and document why you couldn't. Evidence must match the kind of claim: **behavioral** claims (enforces, limits, falls back, redirects, meets a standard) pass only on **executed evidence** — something that ran and could have come out otherwise: a test whose assertions can fail, command output, observed behavior. **Structural** claims (a field exists, a config declares, a call is absent) may pass on inspection — label the verdict "by inspection." When a required execution can't be performed (missing tooling, no environment), that criterion is `blocked` — not passed — the WO stays open, and the user decides.

Prefer a **fresh agent session** (or different agent) than the one that implemented — implementers grade themselves too kindly.

Validators may build setups (harnesses, seeded DBs, local services) to produce executed evidence, with judgment, not haphazardly:

- **Reuse before building.** If the project's dev stack (see Commands & stack in `AGENTS.md`) already provides the service, use it — don't spin up a parallel copy of something already running.
- **Environments:** local/dev by default. Shared staging or test instances are fine where that's the project's stated practice — coordinate anything disruptive (resets, seed wipes) with the user first. Production only on explicit user instruction, never by default.
- **Keep evidence repeatable.** A future validator must be able to repeat every check from the report alone. Where the check is code (harness, script), commit it (e.g. under a non-CI test tag) or embed it in the report; where it isn't (manual UI checks, live-service runs), record the procedure and the observations (steps, outputs, screenshots/logs). Evidence that can't be repeated is testimony — and re-validators trusting testimony is the confirmation habit validation exists to kill.

## Process

For a work order with status `done` (for maintenance WOs — `implements: none` — verify the testing plan and summary objective instead of ACs):

1. Re-read the work order and each acceptance criterion it implements.
2. Attack each criterion: run the testing plan, probe edge cases, and check the tests themselves assert something that could fail. Cite the executed evidence per criterion (test run, command output, observed behavior — with file:line).
3. Check for drift: does the implementation contradict the BRD, blueprint, or **any recorded decision** (check `../DECISIONS.md` beyond just those cited in the work order — e.g. dependency and convention choices)? If so, report to the user — don't silently fix either side.
4. Check for duplication: do the new units overlap an existing registry entry — or each other? Same-WO duplication is the common agent failure; compare the WO's new units against the registry *and* among themselves.
5. Write a report from the template below, saved in this folder as `VAL-WO-XXXX.md` (one report per work order — on re-validation, update the same file with the new date and result; likewise, when a hold or failure noted in a report is later resolved, update the report so it never contradicts current state). If everything passes: set the WO to `validated`, update `../STATE.md`, and when all of a BRD's requirements are validated, update the BRD's status too.
6. If anything fails: list failures in the report, set the WO back to `in-progress`, and note it in STATE.md.

## Drift audits

A periodic whole-project check that code still matches approved BRDs and blueprints, catching drift that accumulates outside validations (human commits, trivial fixes, refactors). Audit merged and `done` work only — in-progress branches are exempt; their gate criteria haven't come due yet.

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
