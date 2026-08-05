---
id: VAL-WO-0004
work-order: WO-0004
date: 2026-08-05
result: pass
---

# Validation: WO-0004

Validated by a session that did not implement the work order. Status note: the WO was still `in-progress` when validation was requested — the implementation (commit `399e9b0`) was complete with all services, routes, tests, and registry units, but the mark-done step never happened. Validation proceeded and passed, resolving the status.

Live checks ran against local Docker PostgreSQL and a production build on port 3100, with seeded operator and viewer accounts (all test data, users, and the server removed afterwards; DB left at 10 seeded KPIs, 0 observations).

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0001.R2.AC1-AC4 (KPI admin list/create/edit/view) | pass | Live: operator `POST /api/kpis` → 201 with all R1 fields and 24h default; `PUT /api/kpis/[id]` persisted edit; `GET` returned sourceUrls, targetValue, unit, category, interval. Services in `src/server/kpis.ts`, tested in `kpis.test.ts`. Validated at API level — the admin UI itself (D-0005) must land in a later WO |
| BRD-0001.R4.AC1-AC2 (batch load, ≤10) | pass | `loadEligibleKpisForPipeline` defaults `limit` 10 (`src/server/kpis.ts:94`); live run returned batch of exactly 10 with 10 eligible KPIs (the 11th, freshly observed, was correctly excluded by WO-0003 eligibility rules) |
| BRD-0001.R4.AC3 (no KPIs → complete empty) | pass | Returns `[]` without enqueueing; covered in `pipeline.test.ts` |
| BRD-0001.R6.AC1-AC4 (pipeline lock) | pass | Live transitions: acquire → 200; re-acquire → 409; `runs start` while locked → 409; release → 200; start after release → `started: true, lock.locked: true`; complete → lock false. Acquisition is race-safe via conditional `updateMany` (`src/server/pipeline.ts:22-25`); lock is checked/set before KPI loading (`pipeline.ts:54-62`) |
| BRD-0002.R11.AC1-AC3 (append-only history) | pass | Live: two accepted observations → 2 history rows, no overwrite; dashboard latest = most recent `created_at` (`src/server/dashboard.ts:10-13`, `orderBy createdAt desc take 1`) |
| BRD-0003.R1.AC1-AC2 (latest + time series) | pass | `GET /api/dashboard/kpis` returns latest observation per KPI; `GET /api/kpis/[id]/observations` returns full series |
| BRD-0003.R1.AC3 (response fields) | pass | Live payload included sourceUrl, observedDate, createdAt, aiConfidence, reviewFlag |
| BRD-0003.R1.AC4 (business logic server-side) | pass | Confidence gating, normalization, latest-selection, and progress calculation all in `src/server/*` and `src/lib/pipeline/*`; live gate results: confidence 0.9 → 201 unflagged, 0.7 → 201 `reviewFlag: true`, 0.5 → 422 rejected |
| BRD-0003.R5.AC1-AC3 (target progress) | pass | Live: KPI with target 50 and latest 25 → `{percent: 50, unit: "percent"}`; KPI without target → `targetProgress: null` (not an error); progress only computed when observation unit equals `expectedUnit` (`src/server/dashboard.ts:60-62`) |
| Role-protected access (BRD-0003.R2 enforcement) | pass | Live: unauthenticated API requests denied (307 to sign-in via middleware); viewer on operator endpoints (`GET /api/kpis`, `POST /api/pipeline/lock`) → 403; viewer on dashboard → 200; operator on admin → 200. Route-level guard `requireApiRole` on every handler (`src/server/api/authz.ts`) |
| Testing plan | pass | `npm run lint` clean; `npm test` 49/49 across 14 files (incl. append-only, latest selection, role denial, lock transitions in `pipeline.test.ts`, `observations.test.ts`, `authz.test.ts`); `npm run build` succeeds with all 7 API routes registered |
| Registry | pass | UNIT-0015 … UNIT-0022 files exist and are indexed in `REGISTRY.md` |

## Drift observed
None against BRDs, BP-0001, or cited decisions. Notes:

1. **BRD-0001.R2 is satisfied at API level only.** D-0005 requires an admin UI in the MVP; WO-0005 now covers the remaining admin UI surface by citing BRD-0001.R2. BRD-0001 should not be considered fully validated until that UI lands.
2. If a pipeline run fails mid-flight after `startPipelineRun`, the lock stays held until an explicit `complete`/`release` call — the n8n workflow (WO-0006) must handle failure-path release. Not an AC violation here; flagged for the WO-0006 implementer.

## Failures
None.

## Merge status
Merged to `main` after user review.
