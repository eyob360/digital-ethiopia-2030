# Registry

Index only — one line per reusable unit, grouped by kind; lists only what exists (removed units keep their file but lose their line). Search here before creating anything reusable.

## Components

- [UNIT-0001](UNIT-0001-button.md) — Button — src/components/ui/button.tsx
- [UNIT-0024](UNIT-0024-app-shell.md) — App shell — src/components/layout/app-shell.tsx
- [UNIT-0025](UNIT-0025-status-badge.md) — Status badge — src/components/dashboard/status-badge.tsx
- [UNIT-0026](UNIT-0026-kpi-card.md) — KPI card — src/components/dashboard/kpi-card.tsx
- [UNIT-0027](UNIT-0027-category-filter.md) — Category filter — src/components/dashboard/category-filter.tsx
- [UNIT-0031](UNIT-0031-kpi-admin-workspace.md) — KPI admin workspace — src/components/forms/kpi-admin-workspace.tsx
- [UNIT-0032](UNIT-0032-pipeline-controls.md) — Pipeline controls — src/components/pipeline/pipeline-controls.tsx

<!-- - [UNIT-0001](UNIT-0001-data-table.md) — DataTable — src/components/DataTable.tsx -->

## Hooks / Utils

- [UNIT-0003](UNIT-0003-role-helpers.md) — Role helpers — src/lib/auth/roles.ts
- [UNIT-0004](UNIT-0004-password-helpers.md) — Password helpers — src/lib/auth/password.ts
- [UNIT-0008](UNIT-0008-initial-kpi-catalogue.md) — Initial KPI catalogue — src/lib/kpi/initial-catalogue.ts
- [UNIT-0010](UNIT-0010-fetch-eligibility.md) — Fetch eligibility — src/lib/pipeline/fetch-eligibility.ts
- [UNIT-0011](UNIT-0011-url-filter.md) — URL filter — src/lib/pipeline/url-filter.ts
- [UNIT-0012](UNIT-0012-content-hash.md) — Content hash — src/lib/pipeline/content-hash.ts
- [UNIT-0013](UNIT-0013-observation-normalization.md) — Observation normalization — src/lib/pipeline/normalization.ts
- [UNIT-0014](UNIT-0014-confidence-gate.md) — Confidence gate — src/lib/pipeline/confidence.ts

## Services / Validators / API clients

- [UNIT-0005](UNIT-0005-prisma-client.md) — Prisma client — src/lib/prisma.ts
- [UNIT-0006](UNIT-0006-auth-options.md) — Auth options — src/server/auth.ts
- [UNIT-0015](UNIT-0015-api-authorization.md) — API authorization — src/server/api/authz.ts
- [UNIT-0016](UNIT-0016-kpi-service.md) — KPI service — src/server/kpis.ts
- [UNIT-0017](UNIT-0017-dashboard-service.md) — Dashboard service — src/server/dashboard.ts
- [UNIT-0018](UNIT-0018-observation-service.md) — Observation service — src/server/observations.ts
- [UNIT-0019](UNIT-0019-pipeline-service.md) — Pipeline service — src/server/pipeline.ts
- [UNIT-0023](UNIT-0023-api-handler-helpers.md) — API handler helpers — src/server/api/handlers.ts
- [UNIT-0035](UNIT-0035-ingestion-api-auth.md) — Ingestion API auth — src/server/api/ingestion-auth.ts
- [UNIT-0036](UNIT-0036-raw-document-service.md) — Raw document service — src/server/raw-documents.ts
- [UNIT-0037](UNIT-0037-tavily-search-provider.md) — Tavily search provider — src/server/search/tavily.ts
- [UNIT-0040](UNIT-0040-external-contract-validators.md) — External contract validators — src/lib/integration/external-contracts.ts

## Endpoints

- [UNIT-0007](UNIT-0007-auth-route.md) — Auth route — src/app/api/auth/[...nextauth]/route.ts
- [UNIT-0009](UNIT-0009-auth-middleware.md) — Auth middleware — src/proxy.ts
- [UNIT-0020](UNIT-0020-kpi-admin-api.md) — KPI admin API — src/app/api/kpis
- [UNIT-0021](UNIT-0021-dashboard-kpi-api.md) — Dashboard KPI API — src/app/api/dashboard/kpis/route.ts
- [UNIT-0022](UNIT-0022-pipeline-api.md) — Pipeline API — src/app/api/pipeline
- [UNIT-0038](UNIT-0038-ingestion-api.md) — Ingestion API — src/app/api/ingestion

## Pages

- [UNIT-0002](UNIT-0002-home-page.md) — Dashboard overview page — src/app/page.tsx
- [UNIT-0028](UNIT-0028-kpi-detail-page.md) — KPI detail page — src/app/kpis/[id]/page.tsx
- [UNIT-0029](UNIT-0029-kpi-admin-page.md) — KPI admin page — src/app/admin/kpis/page.tsx
- [UNIT-0030](UNIT-0030-pipeline-page.md) — Pipeline page — src/app/pipeline/page.tsx
- [UNIT-0033](UNIT-0033-login-page.md) — Login page — src/app/login/page.tsx
- [UNIT-0034](UNIT-0034-account-page.md) — Account page — src/app/account/page.tsx

## Workflows

- [UNIT-0039](UNIT-0039-n8n-ingestion-workflow.md) — n8n ingestion workflow — n8n/workflows/digital-ethiopia-ingestion.json
