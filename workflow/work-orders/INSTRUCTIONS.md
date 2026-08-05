# Work Orders — Instructions

A work order is a **self-contained implementation ticket**: an agent must be able to execute it without reading anything outside the files it links. Scope one to a single agent session's worth of work — split big features into several.

## Process

1. Write it from an approved BRD (and blueprint, if one exists) using the template below. Copy in the relevant requirement IDs and acceptance criteria — don't just link them.
2. Add an index line to `../STATE.md`. Status `ready` means a user has reviewed it. Don't start a WO whose `depends-on` entries aren't at least `done`.
3. To execute: set status `in-progress`, implement, run the testing plan, then follow `../validation/INSTRUCTIONS.md` before marking `done`. When every requirement of a BRD is covered by a `done` work order, set that BRD's status to `implemented`.
4. If implementation reveals the WO is wrong, infeasible, or underspecified: stop, set it back to `draft`, list it under **Blocked** in `../STATE.md`, and raise it with the user — the fix may belong in the BRD or blueprint, not the WO.

## Issue triage

When an issue arises, find the cause before writing anything:

- **Code violates an existing AC** (a bug) → WO citing the existing requirement. No BRD change.
- **The requirement is wrong or missing** → revise the BRD first (see its Revisions rule), then downstream.
- **Orthogonal to requirements** (tech debt, dependency upgrades, tooling, infra) → maintenance WO, below.
- **Trivial** → fix directly (AGENTS.md rule 4).

## Maintenance work orders

For work with no business requirement: set `implements: none` and state the reason in the summary. Everything else is unchanged — indexed in STATE.md, same statuses, validated against its own testing plan instead of ACs. They never count toward a BRD's requirement coverage.

## Statuses

`draft` → `ready` → `in-progress` → `done` → `validated`

Gate criteria:

- `ready`: user reviewed; ACs copied in (not just linked); `depends-on` identified; testing plan concrete (commands + cases); relevant decisions cited
- `done`: full testing plan run and passing; `units-touched` filled; registry entries updated
- `validated`: passing validation report exists

## Template

```markdown
---
id: WO-0001
title: <ticket name>
implements: [BRD-0001.R1, BRD-0001.R2]   # or none (maintenance — state reason in summary)
blueprint: BP-0001   # or none
depends-on: [WO-0002]   # or none
units-touched: []   # registry UNIT ids created or modified; fill during implementation
status: draft
---

# WO-0001: <ticket name>

## Summary
What to build, in a paragraph.

## In scope / Out of scope
Bullet lists of both.

## Requirements
The acceptance criteria being fulfilled, copied from the BRD.

## Implementation notes
Constraints from the blueprint: boundaries, affected areas. Copy in relevant user decisions from `../decisions/` (cite their IDs).

## Testing plan
What must pass: commands to run, cases to cover, manual checks. Cite the testing policy in `../brds/OVERVIEW.md` rather than restating it. While iterating, run only cheap targeted checks; run the full plan once at completion — save expensive checks (full builds, E2E) for validation or where the plan explicitly requires them.
```
