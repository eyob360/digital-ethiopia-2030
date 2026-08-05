---
id: WO-0004
title: Dashboard and admin APIs
implements: [BRD-0001.R2, BRD-0001.R4, BRD-0001.R6, BRD-0002.R11, BRD-0003.R1, BRD-0003.R5]
blueprint: BP-0001
depends-on: [WO-0003]
units-touched: [UNIT-0015, UNIT-0016, UNIT-0017, UNIT-0018, UNIT-0019, UNIT-0020, UNIT-0021, UNIT-0022]
status: validated
---

# WO-0004: Dashboard and admin APIs

## Summary
Build the server-side API/service layer for KPI administration, pipeline state, latest observations, KPI history, and target progress. APIs must enforce auth boundaries and keep dashboard business logic out of the frontend.

## In scope
- KPI definition CRUD service/API for operators.
- KPI loading/eligibility query support for pipeline consumers.
- Pipeline lock/status API or service boundary.
- Latest-observation and time-series data services.
- Target progress calculation.
- Role-protected API access.

## Out of scope
- Visual dashboard pages.
- n8n workflow implementation.
- OpenAI/Tavily provider calls.
- Review approval/rejection workflow.

## Requirements

### BRD-0001.R2: KPI administration UI
- AC1: When an authorized operator opens KPI administration, the system shall list existing KPI definitions.
- AC2: When an authorized operator creates a KPI definition, the system shall capture the fields required by BRD-0001.R1.
- AC3: When an authorized operator edits a KPI definition, the system shall persist changes to the controlled KPI catalogue.
- AC4: When an authorized operator views a KPI definition, the system shall show source URLs, target value, expected unit, category, and fetch interval.

### BRD-0001.R4: KPI batch loading
- AC1: When a pipeline run starts, the system shall load KPI definitions from the database.
- AC2: When loading KPI definitions, the system shall limit each run to no more than 10 KPIs.
- AC3: When no KPI definitions are available, the system shall complete without enqueueing ingestion work.

### BRD-0001.R6: Pipeline concurrency control
- AC1: When the scheduled workflow starts, the system shall check a database pipeline lock before processing.
- AC2: When the pipeline lock is true, the system shall stop the run before loading KPI definitions.
- AC3: When the pipeline lock is false, the system shall set the lock to true before continuing.
- AC4: When the pipeline run completes, the system shall set the lock to false.

### BRD-0002.R11: Append-only observation history
- AC1: When a new observation is accepted, the system shall insert it as a new `kpi_observations` row.
- AC2: When a new observation is accepted, the system shall not overwrite old observations for the same KPI.
- AC3: When dashboard consumers need the current value, the latest observation shall be queryable by ordering observations by `created_at` descending.

### BRD-0003.R1: Dashboard data API
- AC1: When the dashboard requests KPI data, the backend shall expose latest observations for configured KPIs.
- AC2: When the dashboard requests a KPI history, the backend shall expose time-series observations for that KPI.
- AC3: When API data is returned, the backend shall include source URL, observed date, created date, AI confidence, and review flag where available.
- AC4: When API data is returned, the frontend shall not be responsible for heavy business logic such as confidence thresholding, normalization, or latest-observation selection.

### BRD-0003.R5: Target progress
- AC1: When a KPI has a `target_value` and latest observation, the dashboard shall show progress from current value to target.
- AC2: When a KPI lacks a `target_value`, the dashboard shall omit target progress for that KPI without treating it as an error.
- AC3: When target progress is shown, the system shall use the same unit for target and observation values.

## Implementation notes
- Depends on schema/auth from WO-0002 and deterministic rules from WO-0003.
- Register services/endpoints in `workflow/registry/`.
- Keep API response shaping server-side.
- Search-before-create result: created new dashboard/admin API services and endpoints because the registry only had auth, Prisma, seed, and deterministic pipeline helpers.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- Integration tests or repository/service tests for append-only observations, latest selection, role denial, and pipeline lock transitions.

## Completion evidence
- `npm run lint` passed.
- `npm test` passed: 14 test files, 49 tests.
- `npm run build` passed.
- `npm run format` passed.
- `npx prisma validate` passed.
- Repository/service tests cover append-only observation inserts, latest-observation selection, role denial, target progress omission/calculation, KPI pipeline batch limits, and pipeline lock transitions including start-with-lock behavior.
