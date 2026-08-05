---
id: WO-0007
title: Integration hardening and operations docs
implements: none
blueprint: BP-0001
depends-on: [WO-0005, WO-0006]
units-touched: [UNIT-0037, UNIT-0040]
status: validated
---

# WO-0007: Integration hardening and operations docs

## Summary
Harden the MVP integration after dashboard and ingestion pieces exist. This maintenance work order closes gaps in contract tests, mocked external-service flows, seed/reset documentation, and operator runbooks before validation.

## In scope
- Contract-style tests/mocks for OpenAI, Tavily, and n8n boundaries.
- End-to-end seed/reset documentation for local development.
- Operational runbook for env vars, local services, pipeline execution, and troubleshooting.
- Full check command documentation.
- Registry cleanup for any reusable units created by prior work orders but not registered.

## Out of scope
- New feature behavior beyond approved BRDs.
- Human validation interface.
- Production deployment.

## Requirements
Maintenance work order. Validate against this work order's summary, scope, blueprint constraints, and testing plan instead of BRD acceptance criteria.

## Implementation notes
- Depends on both the dashboard UI and n8n ingestion work orders.
- Do not add live external API requirements to default local tests.
- Keep secrets out of docs and fixtures.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- `docker compose config`
- Run documented seed/reset flow, or explicitly document any local prerequisite that prevents it.
- Verify external-service mocks cover success, invalid JSON, missing credentials, and retry/error paths.

## Completion evidence
- 2026-08-05: created [UNIT-0040](../registry/UNIT-0040-external-contract-validators.md) after registry search found no existing reusable external contract validator; reused/extended existing [UNIT-0037](../registry/UNIT-0037-tavily-search-provider.md) tests for provider error-path coverage.
- 2026-08-05: added contract tests for checked-in OpenAI/Tavily success mocks, invalid OpenAI payloads, invalid Tavily rows, Tavily missing credentials, Tavily HTTP failures, and n8n retry/error-path wiring without live external credentials.
- 2026-08-05: added [operations runbook](../../docs/operations.md) covering env vars, local services, seed/reset flow, full checks, n8n dry run, troubleshooting, and the WO-0006 carried-forward operational notes.
- 2026-08-05: pinned the local n8n compose image to `n8nio/n8n:2.33.0`; `docker compose config` confirmed the pinned image in rendered config. Existing running n8n container still used the old image until recreated.
- 2026-08-05: `npm run db:migrate` passed against local PostgreSQL with no pending migrations; `npm run db:seed` passed. `npm run db:reset` was documented but not executed because it drops local data and requires explicit operator approval.
- 2026-08-05: full checks passed: `npm run lint`, `npm test` (19 files / 69 tests), `npm run build`, `npm run format`, `npx prisma validate`, and `docker compose config`.
