---
id: VAL-WO-0002
work-order: WO-0002
date: 2026-08-05
result: pass
---

# Validation: WO-0002

Validated by a session that did not implement the work order. Live checks ran against the local Docker PostgreSQL and a production build served on port 3100 (test user and server removed afterwards).

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0001.R1.AC1 (KPI fields) | pass | `prisma/schema.prisma:72-86` — `KpiDefinition` has id, name, description, expected_unit, category, optional source_urls, optional target_value, fetch_interval_hours |
| BRD-0001.R1.AC2 (default 24h interval) | pass | `fetchIntervalHours Int @default(24)` (`prisma/schema.prisma:80`); DB query: 10/10 seeded KPIs have `fetch_interval_hours = 24` |
| BRD-0001.R1.AC3 (empty source_urls allowed) | pass | `sourceUrls String[] @default([])` — empty array is valid; pipeline fallback is later WO scope |
| BRD-0001.R1.AC4 (target_value as progress target) | pass | `targetValue Decimal? @db.Decimal(18,4)` — same numeric type as `KpiObservation.value` (`prisma/schema.prisma:77,103`) |
| BRD-0001.R3.AC1 (initial catalogue seeded) | pass | `npm run db:seed` against local Postgres; DB query returned 10 KPI definitions matching D-0006 exactly |
| BRD-0001.R3.AC2 (empty targets allowed) | pass | DB query: 5 of 10 KPIs have `target_value`, matching D-0006 (5 with, 5 without) |
| BRD-0001.R3.AC3 (source URLs stored) | pass | `prisma/seed.mjs` stores D-0006's preferred URLs; verified in `src/lib/kpi/initial-catalogue.ts` and seeded rows |
| BRD-0001.R3.AC4 (default interval for starters) | pass | Seed omits custom intervals; all rows landed at the schema default of 24 |
| BRD-0003.R2.AC1 (login required) | pass | `src/proxy.ts` (Next 16 middleware convention) + live probe: unauthenticated `GET /` → 307 to `/api/auth/signin`; build output confirms "ƒ Proxy (Middleware)" is registered |
| BRD-0003.R2.AC2 (operator allowed) | pass | Live credentials login as seeded operator → session `{role: "OPERATOR"}`; authed `GET /` → 200. `canUseOperatorControls` returns true only for OPERATOR (`src/lib/auth/roles.ts:9-11`, `roles.test.ts`) |
| BRD-0003.R2.AC3 (viewer read-only access) | pass | `canViewDashboard` allows OPERATOR and VIEWER (`src/lib/auth/roles.ts:5-7`); role defaults to VIEWER in schema; helper behavior unit-tested |
| BRD-0003.R2.AC4 (viewer denied admin) | pass | `canUseOperatorControls("VIEWER")` → false, unit-tested in `src/lib/auth/roles.test.ts`; enforcement wiring lands with the admin APIs (WO-0004, in that WO's scope) |
| BRD-0003.R2.AC5 (unauthenticated API denied) | pass | Middleware matcher covers all routes except `api/auth` and static assets; live probe redirected unauthenticated requests; bad-password login → `CredentialsSignin` error, no session |
| Testing plan commands | pass | `npm run lint` clean; `npm test` 10/10 across 4 files; `npm run build` succeeds; `npx prisma validate` valid; `npm run db:migrate` (no pending after `0001_initial`) and `npm run db:seed` ran against local Postgres; `npm audit --omit=dev` 0 vulnerabilities |
| Non-vulnerable Auth.js path | pass | `next-auth@^4.24.15` (stable v4, not the beta path deferred in WO-0001); middleware reads `NEXTAUTH_SECRET`/`AUTH_SECRET`, both templated in `.env.example` with placeholders only |
| Registry entries | pass | UNIT-0003 … UNIT-0009 files exist and are indexed in `REGISTRY.md`; paths resolve |

## Drift observed
None against the BRDs, BP-0001, or cited decisions. Two process/quality notes for the user:

1. **No decision record for the new dependencies.** WO-0002 added `next-auth@4`, `@next-auth/prisma-adapter`, `pg`, and `@prisma/adapter-pg`. Conventions require recording new-dependency choices (and rejected alternatives) in `workflow/decisions/`; the rationale currently lives only in the work-order text. Worth capturing as a decision (e.g. the deliberate choice of stable v4 over the v5 beta).
2. **Catalogue duplication.** `prisma/seed.mjs` duplicates the KPI catalogue and scrypt hashing from `src/lib/kpi/initial-catalogue.ts` / `src/lib/auth/password.ts` (JS/TS boundary). The copies match today; a later change to one side could drift silently.

## Failures
None.

## Merge status
Held for user review before merge — WO-0002 touches auth, which the project conventions flag for mandatory user review even after validation passes.
