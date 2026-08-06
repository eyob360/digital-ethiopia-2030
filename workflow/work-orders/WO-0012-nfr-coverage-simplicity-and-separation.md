---
id: WO-0012
title: NFR coverage — operational simplicity and separation of concerns
implements: [BRD-0001.N1, BRD-0003.N1]
blueprint: BP-0001
depends-on: none
units-touched: []
status: in-progress
---

# WO-0012: NFR coverage — operational simplicity and separation of concerns

## Summary
BRD-0001.N1 and BRD-0003.N1 were never covered by any work order or validation report — the traceability gap that broke both BRDs' `validated` gates (D-0017). This WO makes both NFRs implemented and validatable: add executable guards where possible (a dependency-manifest test asserting no distributed-processing, vector-DB, or warehouse packages) and documented inspection evidence where the claim is structural (heavy ingestion/transformation logic lives in `src/server`/`src/lib/pipeline`/n8n, not in dashboard components). After this WO is `done` and the fix WOs land, BRD-0001 and BRD-0003 can progress to `implemented`.

## In scope
- A test that fails if `package.json` gains dependencies in forbidden categories (vector DBs, distributed processing frameworks, warehouse clients) — executable evidence for N1.AC1.
- Inspection evidence, written into this WO on completion, that dashboard pages/components contain no confidence thresholding, normalization, or latest-observation selection (BRD-0003.N1.AC1 / BRD-0003.R1.AC4 boundary) — e.g. the existing server services are the only implementors.
- The Tavily-vs-NFR conflict is resolved: D-0020 revised BRD-0001.N1.AC1 and BRD-0002.N2.AC3 to permit the configured fallback search-provider API alongside the LLM API. The dependency-guard test's forbidden list must reflect that (LLM + search-provider clients allowed; vector DBs, distributed processing, warehouse clients forbidden).

## Out of scope
- Any behavior changes to pipeline or dashboard code (fix WOs cover those).

## Requirements

### BRD-0001.N1: Operational simplicity
- AC1: When running the MVP pipeline, the system shall avoid distributed processing, vector databases, data warehouses, and paid data APIs other than the LLM API and the configured fallback search-provider API (D-0007, D-0020).

### BRD-0003.N1: Separation of concerns
- AC1: When dashboard pages render KPI data, heavy ingestion and transformation logic shall remain in the backend or pipeline layer.

## Implementation notes
- Under the validation rules, "avoid X" and "logic stays in backend" are structural claims — validation may pass them by inspection, but the dependency-guard test gives N1 durable executed evidence cheaply.
- Touch points: test files only (the BRD revisions for the Tavily question already landed with D-0020).

## Testing plan
- `npm run lint`, `npm test` (testing policy in `../brds/OVERVIEW.md`).
- The new dependency-guard test passes on the current tree and demonstrably fails when a forbidden package name is injected into its input.

## Implementation record (2026-08-06)

### Dependency guard (BRD-0001.N1.AC1)

- **Test:** `src/lib/dependency-guard.test.ts` (runs in `npm test`). It reads the real `package.json` (`dependencies` + `devDependencies`) and fails if any package name matches a forbidden category, using token-based matching over the package name (fail-loud by design; false positives are resolved by adding the exact name to the in-file allowlist with rationale, never by weakening the forbidden lists).
- **Forbidden categories** (derived from N1.AC1's four clauses): vector databases (pinecone, weaviate, chromadb, qdrant, milvus, pgvector, faiss, lancedb, vectra, vespa, marqo); distributed processing frameworks incl. streaming and distributed job orchestration (kafka/kafkajs/rdkafka, spark, flink, hadoop, airflow, temporal/temporalio, bull/bullmq, celery, amqplib, rabbitmq, zeromq, nats, pulsar, dask); data warehouse clients (snowflake, bigquery, redshift, clickhouse, databricks, teradata, athena); paid data-API clients other than the sanctioned ones (serpapi, newsapi, scraperapi, scrapingbee, apify, brightdata, diffbot, zenrows).
- **Allowlist (D-0020, D-0007, D-0014):** exact names `openai`, `tavily`, `@tavily/core` — the LLM API client and the configured fallback search-provider client. None are currently in `package.json` (both APIs are called over HTTP from n8n / `src/server/search/tavily.ts`), but the allowlist keeps the guard correct if the sanctioned SDKs are ever added.
- **Injection check (testing plan):** a second test case injects a representative package from each category into the guard's input (`@pinecone-database/pinecone`, `chromadb`, `kafkajs`, `node-rdkafka`, `@temporalio/client`, `snowflake-sdk`, `@google-cloud/bigquery`, `@clickhouse/client`, `serpapi`) and asserts each is flagged with the right category; a third asserts the D-0020 allowlist passes.
- **Registry branch:** searched `../registry/REGISTRY.md` — no unit covers dependency guarding. Created nothing reusable: the guard is a self-contained test file (the registry catalogues runtime units — components/hooks/services/endpoints/pages — not tests), so `units-touched` stays empty.

### Separation-of-concerns inspection (BRD-0003.N1.AC1 / BRD-0003.R1.AC4 boundary)

Inspected every non-test UI file under `src/app` (excluding `src/app/api`) and `src/components` at branch point `0fb0ffd`: the 8 pages (`src/app/page.tsx`, `kpis/[id]/page.tsx`, `admin/kpis/page.tsx`, `admin/url-filter/page.tsx`, `pipeline/page.tsx`, `login/page.tsx`, `account/page.tsx`, `layout.tsx`) and the 10 components (`components/dashboard/{kpi-card,category-filter,status-badge}.tsx`, `components/forms/{kpi-admin-workspace,url-filter-config-workspace,login-form,account-actions}.tsx`, `components/layout/app-shell.tsx`, `components/pipeline/pipeline-controls.tsx`, `components/ui/button.tsx`). Method: grep for thresholding/normalization/selection vocabulary (`confiden|threshold|normaliz|latest`) and transformation patterns (`.sort(|.filter(|.reduce(|Math.|toFixed|parseFloat|Number(`), then read every hit and the dashboard-path files in full.

**Result: clean.** No confidence thresholding, no observation normalization, and no latest-observation selection exist in UI code; the server layer is the sole implementor of each:

- **Confidence thresholding:** only in `src/lib/pipeline/confidence.ts` (`applyConfidenceGate`, reject/review/insert thresholds), invoked from `src/server/observations.ts`. UI touches confidence solely to display it (`kpi-card.tsx:67`, `kpis/[id]/page.tsx:112` — percent formatting of a server-provided value).
- **Normalization:** only in `src/lib/pipeline/normalization.ts` (`normalizeObservationCandidate`, unit/value/date/URL normalization), invoked from `src/server/observations.ts`. No UI import of these functions exists.
- **Latest-observation selection:** only in `src/server/dashboard.ts` (`orderBy: { createdAt: "desc" }, take: 1` and `kpi.observations[0]`); target-progress derivation (unit match + percent) is likewise computed there and consumed ready-made by `kpi-card.tsx` (`targetProgress.percent`).
- Pages fetch via the server services (`getDashboardKpis`, `getKpiHistory` from `@/server/dashboard`); everything the UI does beyond rendering is presentation-level: date/percent formatting (`kpi-card.tsx:90–96`, `kpis/[id]/page.tsx:142–148`), summary counts over server-shaped rows (`page.tsx:11–13`), client-side category filtering for display (`category-filter.tsx:16`), form-input parsing and alphabetical list ordering in admin forms (`kpi-admin-workspace.tsx:70–90`, `url-filter-config-workspace.tsx:129`). The single `@/lib/pipeline` import in a page (`admin/url-filter/page.tsx:6`) is the `defaultBlockedDomainCategories` constant used to render the admin form's defaults — data, not transformation logic.

### Verification

`npm run lint`, `npm test` (23 files, 95 tests incl. the 3 new guard tests), and `npm run build` all pass on this branch.
