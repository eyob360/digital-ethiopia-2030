---
id: WO-0008
title: Pre-dashboard maintenance cleanup
implements: none
blueprint: BP-0001
depends-on: [WO-0004]
units-touched: [UNIT-0015, UNIT-0019, UNIT-0020, UNIT-0021, UNIT-0022, UNIT-0023]
status: validated
---

# WO-0008: Pre-dashboard maintenance cleanup

## Summary
Maintenance cleanup before starting WO-0005. Resolve validated API duplication, align dependency pins with recorded decisions, and update stale validation report text so workflow state does not contradict merged code.

## In scope
- Remove duplicated KPI batch loader shape between KPI and pipeline services.
- Share the repeated role-protected KPI-list API handler structure.
- Align API authorization role requirement vocabulary with registered uppercase `UserRole` values.
- Pin package versions instead of using `latest`.
- Update stale validation report merge-hold text.
- Register any new reusable maintenance units.

## Out of scope
- New user-facing UI.
- New business behavior.
- New dependencies.

## Requirements
Maintenance work order: no business requirements. Validate against the summary objective and testing plan.

## Implementation notes
- Cites [D-0016](../decisions/D-0016-auth-database-dependencies.md), [D-0014](../decisions/D-0014-application-stack.md), and registered [UNIT-0003](../registry/UNIT-0003-role-helpers.md).
- Keep changes behavior-preserving where possible.
- Search before creating any new reusable helpers.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run format`
- `npx prisma validate`
- Verify no `latest` dependency spec remains in `package.json`.

## Completion evidence
- 2026-08-05: `npm run lint` passed.
- 2026-08-05: `npm test` passed, 14 files / 48 tests.
- 2026-08-05: `npm run build` passed.
- 2026-08-05: `npm run format` passed.
- 2026-08-05: `npx prisma validate` passed.
- 2026-08-05: `rg -n '"viewer"|"operator"|loadPipelineKpiBatch|"latest"' src workflow package.json package-lock.json` returned no matches.
