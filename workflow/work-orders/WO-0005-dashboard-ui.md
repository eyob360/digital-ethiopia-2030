---
id: WO-0005
title: Dashboard UI
implements: [BRD-0003.R3, BRD-0003.R4, BRD-0003.R6]
blueprint: BP-0001
depends-on: [WO-0004]
units-touched: []
status: ready
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

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- Manual responsive inspection at desktop and mobile widths.
- Accessibility-focused checks for keyboard access, visible focus, text contrast, and role-based navigation visibility.
