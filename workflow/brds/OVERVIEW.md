# Product Overview

## Business problem
Digital Ethiopia 2030 KPI progress is distributed across public and institutional web sources, making it difficult to keep an up-to-date intelligence view without manual collection, interpretation, and spreadsheet maintenance. The product needs to automate KPI data discovery, extraction, validation, storage, and dashboard presentation while keeping operating cost and implementation complexity low.

## Current state
The project is a new single-repo web app. The source requirement document describes an MVP intelligence dashboard and data pipeline architecture using n8n, a relational database, OpenAI API calls, HTTP-based web retrieval, and an API/dashboard layer.

## Personas
- Internal program analyst: monitors Digital Ethiopia 2030 KPI progress and reviews low-confidence observations.
- Technical operator: configures KPIs, source URLs, fetch intervals, pipeline runs, and operational safeguards.
- Decision maker: views current KPI status, trends, source evidence, and progress against targets.

## Product description
The Digital Ethiopia 2030 Intelligence Dashboard is an internal MVP web application backed by an automated ingestion pipeline. It loads controlled KPI definitions, checks priority source URLs before falling back to AI-generated search, fetches and deduplicates candidate documents, uses AI only for relevance classification and structured extraction, deterministically normalizes extracted observations, gates them by confidence, stores every accepted observation append-only, and exposes the latest and historical KPI data to a dashboard.

## Success metrics
- KPI observations are collected and stored with source traceability.
- High-confidence observations can be inserted automatically.
- Medium-confidence observations are retained with a review flag.
- Low-confidence observations are rejected before reaching the dashboard.
- Pipeline execution avoids concurrent runs and respects per-KPI fetch intervals.
- The dashboard can show latest KPI values, historical observations, and progress against targets.

## Build order
1. Shared project foundation: app scaffold, database schema, configuration, API conventions, base UI components, error handling, and test setup.
2. KPI definition and pipeline control: KPI records, source URLs, target values, fetch intervals, pipeline lock, and enqueue eligibility.
3. Ingestion pipeline: priority URL handling, fallback query generation/search, URL filtering, content fetching, duplicate detection, AI relevance/extraction, normalization, confidence gates, retries, and observation storage.
4. Dashboard API and visualization: latest observations, time series, source evidence, review flags, and progress against targets.
5. Operations and review enhancements after MVP validation: monitoring, human validation interface, source credibility scoring, queueing, and additional scale features.

## Testing policy
Use unit tests for deterministic business rules such as fetch-interval eligibility, URL deduplication, hash handling, normalization, confidence thresholds, and dashboard data shaping. Use integration tests for database writes, append-only observation behavior, API responses, and pipeline state transitions. Use mocked contract-style tests around OpenAI and web-search/fetch boundaries so iteration does not depend on live external services. E2E tests should cover the dashboard's primary read workflows once the UI exists.

Cheap checks while iterating should be targeted unit tests and type/lint checks for touched code. Work-order completion should run the relevant unit and integration suite. Validation/CI should run full build, full tests, and selected E2E tests where applicable.

## Technical requirements
- Stack: web app with n8n orchestration, PostgreSQL preferred by the SRS with MySQL allowed as an alternative, OpenAI API for language reasoning/extraction, HTTP request based web retrieval, and backend API or GraphQL for dashboard access.
- AI usage: AI shall be used for query generation, relevance classification, and structured extraction only; deterministic computation shall remain rule-based.
- Data model: core schema includes `kpi_definitions`, `raw_documents`, and `kpi_observations`.
- Schema authority: the implementation must declare a single authoritative schema source once the stack is chosen.
- Data retention: KPI observations are append-only; old values are never overwritten.
- Security and authorization: login is required for the MVP; `operator` users can manage KPI definitions and operational controls, while `viewer` users have read-only dashboard access.
- Accessibility: dashboard UI shall target WCAG 2.2 AA.
- Localization: multi-language processing is explicitly out of MVP scope.
- Performance and limits: MVP safeguards include max 10 documents per hour, max 5 URLs per KPI, max 10 KPIs per run, one pipeline execution at a time, and strict JSON validation for AI outputs.
