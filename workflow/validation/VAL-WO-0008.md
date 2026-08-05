---
id: VAL-WO-0008
work-order: WO-0008
date: 2026-08-05
result: pass
---

# Validation: WO-0008

Maintenance work order (`implements: none`) — validated against the summary objective, scope, and testing plan. Validated by a session that did not implement it.

| Criterion | Verdict | Evidence |
|---|---|---|
| KPI batch loader duplication removed | pass | `loadPipelineKpiBatch` wrapper deleted from `src/server/pipeline.ts`; `startPipelineRun` and the pipeline KPI route call `loadEligibleKpisForPipeline` directly — same loader, same default options, behavior preserved |
| Repeated role-protected list handler shared | pass | New `jsonListWithRole` helper (`src/server/api/handlers.ts`) used by the dashboard and pipeline KPI routes; registered as UNIT-0023 in `REGISTRY.md` |
| Role vocabulary aligned with `UserRole` | pass | `ApiRoleRequirement` is now the uppercase `UserRole` type; `"VIEWER"` requirement still admits both roles via `canViewDashboard`, `"OPERATOR"` remains operator-only — semantics unchanged, tests updated (`authz.test.ts`) |
| Dependencies pinned | pass | Zero `"latest"` specs remain across all 21 entries in `package.json`; `npm audit --omit=dev` still reports 0 vulnerabilities |
| Stale validation report text updated | pass | VAL-WO-0001 pinning note marked resolved; VAL-WO-0003/0004 merge-hold text replaced with "Merged to `main` after user review"; VAL-WO-0004 admin-UI note updated to reflect WO-0005 now citing BRD-0001.R2 |
| Registry updates | pass | UNIT-0023 file exists and is indexed; UNIT-0015/0019 descriptions updated to match the refactor |
| Testing plan | pass | `npm run lint` clean; `npm test` 48/48 across 14 files (one test removed with the deleted wrapper); `npm run build` succeeds; `npm run format` clean; `npx prisma validate` valid; `grep` for `"viewer"`/`"operator"`/`loadPipelineKpiBatch` in `src/` returns nothing |

## Drift observed
None. Changes are behavior-preserving as required by the work order; no new dependencies, UI, or business behavior.

## Failures
None.

## Merge status
Released for merge after user validation/review.
