---
id: WO-0001
title: Foundation scaffold
implements: none
blueprint: BP-0001
depends-on: none
units-touched: [UNIT-0001, UNIT-0002]
status: validated
---

# WO-0001: Foundation scaffold

## Summary
Scaffold the MVP application foundation so later work orders can build data, auth, pipeline, and dashboard features on a stable base. This is a maintenance work order because it establishes project infrastructure and does not fully implement a user-facing BRD requirement by itself.

## In scope
- Next.js + TypeScript application scaffold.
- Tailwind CSS setup with a small semantic token set.
- shadcn-style component-library foundation.
- Basic lint, format, test, and build commands.
- Docker Compose services for local PostgreSQL and n8n.
- Environment variable templates with no secrets.
- Initial project documentation updates for actual commands and local startup.
- Registry updates for reusable foundation units created by this work.
- Auth.js package installation was deferred to the data/auth work order after `next-auth@latest` resolved to a vulnerable beta dependency path during foundation installation. The stack decision still requires Auth.js; the later auth work order must choose a non-vulnerable version deliberately.

## Out of scope
- Prisma schema and migrations.
- Auth.js login and roles.
- KPI seed data.
- Dashboard pages beyond scaffold placeholders.
- n8n workflow implementation.
- OpenAI/Tavily integration.

## Requirements
Maintenance work order. Validate against this work order's summary, scope, blueprint constraints, and testing plan instead of BRD acceptance criteria.

## Implementation notes
- Blueprint: [BP-0001](../blueprints/BP-0001-mvp-architecture-and-build-plan.md).
- Stack decision: [D-0014](../decisions/D-0014-application-stack.md).
- Development approach: [D-0015](../decisions/D-0015-development-approach.md).
- Accessibility target: [D-0013](../decisions/D-0013-accessibility-target.md).
- The Next.js `app/` tree is the route source of truth for the page-map module.
- Tailwind/theme config is the semantic token source for the design-tokens module.
- shadcn-style local components are the locked component-library pattern for the design-system module.
- Search-before-create result: `workflow/registry/REGISTRY.md` has no existing reusable units; create new foundation units only where needed and register intentionally reusable ones.

## Testing plan
Follow the project testing policy in [OVERVIEW.md](../brds/OVERVIEW.md).

Cheap checks while iterating:
- `npm run lint`
- `npm test`

Completion checks:
- `npm run lint`
- `npm test`
- `npm run build`
- Confirm `docker compose config` succeeds.
- Confirm no secrets are committed in env templates.
- Confirm `AGENTS.md` commands match implemented package scripts.
- Confirm registry entries exist for reusable units created by this work.

## Completion notes
- `npm run lint` passed.
- `npm test` passed.
- `npm run build` passed.
- `npm run format` passed after narrowing formatting to app/config files and README so immutable workflow SRS documents are not rewritten.
- `docker compose config` passed.
- `npm audit --omit=dev` reported 0 vulnerabilities after deferring out-of-scope Auth.js package installation to the data/auth work order.
- `.env.example` contains placeholders only; real secrets remain uncommitted.
