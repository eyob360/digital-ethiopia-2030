---
id: WO-0007
title: Integration hardening and operations docs
implements: none
blueprint: BP-0001
depends-on: [WO-0005, WO-0006]
units-touched: []
status: ready
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
