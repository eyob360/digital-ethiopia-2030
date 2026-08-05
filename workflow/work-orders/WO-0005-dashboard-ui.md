---
id: WO-0005
title: Dashboard UI
implements: [BRD-0001.R2, BRD-0003.R3, BRD-0003.R4, BRD-0003.R6]
blueprint: BP-0001
depends-on: [WO-0004, WO-0008]
units-touched: [UNIT-0002, UNIT-0009, UNIT-0024, UNIT-0025, UNIT-0026, UNIT-0027, UNIT-0028, UNIT-0029, UNIT-0030, UNIT-0031, UNIT-0032, UNIT-0033, UNIT-0034]
status: done
---

# WO-0005: Dashboard UI

## Summary
Build the MVP user-facing pages using the route SSOT and locked component style: dashboard overview, KPI detail, KPI admin, pipeline status/runs, and login/account basics.

## In scope
- Dashboard overview page.
- KPI detail page with history and source traceability.
- KPI admin page wired to API boundaries.
- Pipeline status/runs page.
- Login/account basics.
- Viewer/operator navigation and access states.
- Registry page/component entries.

## Out of scope
- Human approval/rejection of review-flagged observations.
- n8n workflow implementation.
- New component library.

## Requirements

### BRD-0001.R2: KPI administration UI
- AC1: When an authorized operator opens KPI administration, the system shall list existing KPI definitions.
- AC2: When an authorized operator creates a KPI definition, the system shall capture the fields required by BRD-0001.R1.
- AC3: When an authorized operator edits a KPI definition, the system shall persist changes to the controlled KPI catalogue.
- AC4: When an authorized operator views a KPI definition, the system shall show source URLs, target value, expected unit, category, and fetch interval.

### BRD-0003.R3: Latest KPI view
- AC1: When the dashboard loads, it shall display configured KPIs grouped or filterable by category.
- AC2: When a KPI has at least one observation, the dashboard shall display its latest value, unit, region, observed date, and confidence/review status.
- AC3: When a KPI has no observations, the dashboard shall display an empty state for that KPI.

### BRD-0003.R4: Historical KPI view
- AC1: When a user opens a KPI detail view, the dashboard shall show historical observations for that KPI.
- AC2: When historical observations are shown, the dashboard shall preserve source traceability for each observation.
- AC3: When historical observations contain review-flagged values, the dashboard shall visibly distinguish them from auto-accepted values.
- AC4: When historical observations contain review-flagged values, the MVP shall not provide approve or reject actions.

### BRD-0003.R6: MVP page set
- AC1: When an authenticated user opens the app, the system shall provide a dashboard overview page.
- AC2: When an authenticated user selects a KPI, the system shall provide a KPI detail page.
- AC3: When an authenticated `operator` manages KPI definitions, the system shall provide a KPI admin page.
- AC4: When an authenticated `operator` monitors ingestion operations, the system shall provide a pipeline status/runs page.
- AC5: When a user authenticates or manages basic session/account state, the system shall provide login/account basics.
- AC6: When a `viewer` navigates the app, the system shall hide or deny operator-only pages and actions.

## Implementation notes
- Cite and follow [D-0012](../decisions/D-0012-mvp-page-set.md), [D-0011](../decisions/D-0011-review-flag-scope.md), and [D-0013](../decisions/D-0013-accessibility-target.md).
- Use `src/app/` as route SSOT.
- Use semantic tokens and local shadcn-style components only.
- Register significant pages and reusable components.
- Search-before-create result: reused `Button`, existing auth/session services, and dashboard/KPI/pipeline services; extended `UNIT-0002` and `UNIT-0009`; created app-shell, dashboard, admin, pipeline, login, and account UI units because the registry had no existing page/component layer for them.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- Manual responsive inspection at desktop and mobile widths.
- Accessibility-focused checks for keyboard access, visible focus, text contrast, and role-based navigation visibility — executed via Playwright + axe-core per [D-0018](../decisions/D-0018-accessibility-validation-tooling.md): axe WCAG 2.2 AA scan plus scripted keyboard-navigation and focus-visibility checks (validation-tier cost; devDependencies to be added at re-validation).

## Completion evidence
- 2026-08-05: `npm run lint` passed.
- 2026-08-05: `npm test` passed, 14 files / 48 tests.
- 2026-08-05: `npm run build` passed.
- 2026-08-05: `npm run format` passed.
- 2026-08-05: `npx prisma validate` passed.
- 2026-08-05: local route inspection passed with seeded operator and viewer accounts: `/`, `/admin/kpis`, `/pipeline`, `/account`, `/login`, and `/kpis/[id]`.
- 2026-08-05: viewer route check confirmed operator pages redirect to `/` and dashboard navigation hides `KPI Admin` / `Pipeline`.
- 2026-08-05: markup/CSS accessibility pass confirmed labelled form fields, semantic tables, keyboard-visible focus styles, non-viewport-scaled type, and review-flag visibility without approve/reject actions. Browser screenshot connector was unavailable, so visual inspection evidence is route/markup based.
