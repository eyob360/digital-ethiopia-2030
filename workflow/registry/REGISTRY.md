# Registry

Index only — one line per reusable unit, grouped by kind; lists only what exists (removed units keep their file but lose their line). Search here before creating anything reusable.

## Components

- [UNIT-0001](UNIT-0001-button.md) — Button — src/components/ui/button.tsx

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

## Endpoints

- [UNIT-0007](UNIT-0007-auth-route.md) — Auth route — src/app/api/auth/[...nextauth]/route.ts
- [UNIT-0009](UNIT-0009-auth-middleware.md) — Auth middleware — src/proxy.ts

## Pages

- [UNIT-0002](UNIT-0002-home-page.md) — Home page scaffold — src/app/page.tsx
