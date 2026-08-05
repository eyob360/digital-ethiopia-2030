---
id: WO-0002
title: Data and auth foundation
implements: [BRD-0001.R1, BRD-0001.R3, BRD-0003.R2]
blueprint: BP-0001
depends-on: [WO-0001]
units-touched: [UNIT-0003, UNIT-0004, UNIT-0005, UNIT-0006, UNIT-0007, UNIT-0008, UNIT-0009]
status: done
---

# WO-0002: Data and auth foundation

## Summary
Create the durable schema, migrations, seed data, and authentication/authorization foundation for the MVP. This work order establishes Prisma as schema authority, seeds the approved starter KPI catalogue, and protects application access with `operator` and `viewer` roles.

## In scope
- Prisma schema and initial migration for users/auth tables, KPI definitions, raw documents, observations, and pipeline status primitives.
- Seed script for the initial KPI catalogue in BRD-0001.
- Auth.js login foundation with a deliberately selected non-vulnerable package version.
- Role model and route/API authorization helpers for `operator` and `viewer`.
- Environment documentation for database/auth settings.

## Out of scope
- Full KPI admin UI.
- Dashboard data API endpoints.
- n8n ingestion workflow.
- OpenAI/Tavily integration.

## Requirements

### BRD-0001.R1: KPI definitions
- AC1: When a KPI definition is stored, the system shall support `id`, `name`, `description`, `expected_unit`, `category`, optional `source_urls`, optional `target_value`, and `fetch_interval_hours`.
- AC2: When `fetch_interval_hours` is not provided, the system shall use a default interval of 24 hours.
- AC3: When `source_urls` is empty, the system shall allow the pipeline to use fallback AI-generated web search.
- AC4: When `target_value` is present, the system shall treat it as the dashboard progress target in the same unit as observations.

### BRD-0001.R3: Initial KPI catalogue
- AC1: When the MVP is initialized, the system shall include the initial KPI catalogue listed in this BRD.
- AC2: When a starter KPI has no confirmed numeric target, the system shall allow `target_value` to remain empty.
- AC3: When a starter KPI has preferred source URLs, the system shall store those URLs in `source_urls`.
- AC4: When a starter KPI has no custom fetch interval, the system shall use the default interval from BRD-0001.R1.

### BRD-0003.R2: Authentication and roles
- AC1: When a user accesses the MVP, the system shall require login before showing dashboard or admin data.
- AC2: When an `operator` is authenticated, the system shall allow KPI administration and operational controls.
- AC3: When a `viewer` is authenticated, the system shall allow read-only dashboard access.
- AC4: When a `viewer` attempts KPI administration or operational control actions, the system shall deny the action.
- AC5: When an unauthenticated request is made to protected dashboard or admin APIs, the system shall deny the request.

## Implementation notes
- Cite and follow [D-0014](../decisions/D-0014-application-stack.md), [D-0010](../decisions/D-0010-dashboard-auth-roles.md), and [D-0006](../decisions/D-0006-initial-kpi-catalogue.md).
- `next-auth@latest` was deferred in WO-0001 because it resolved to vulnerable beta dependencies. Pick and document a non-vulnerable Auth.js/NextAuth package path before installing.
- Prisma migrations are authoritative; do not hand-maintain duplicate schema docs.
- Search-before-create: check `workflow/registry/REGISTRY.md` and existing `src/` before adding helpers/services.
- Search-before-create result: created new units because the registry only contained the foundation button and home-page scaffold, and no existing auth, Prisma, or KPI catalogue helpers existed.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- `npx prisma validate`
- Run migration/seed against the local PostgreSQL service or explain why it cannot run.
- Unit-test role helper behavior and seed catalogue shape.

## Completion evidence
- `npm run lint` passed.
- `npm test` passed: 4 test files, 10 tests.
- `npm run format` passed.
- `npm run build` passed.
- `npx prisma validate` passed.
- `npm run db:migrate` passed against local PostgreSQL: no pending migrations after applying `0001_initial`.
- `npm run db:seed` passed against local PostgreSQL.
- Seed verification query returned 10 KPI definitions and an unlocked `INGESTION` pipeline lock.
- `npm audit --omit=dev` passed with 0 vulnerabilities.
