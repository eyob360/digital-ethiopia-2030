---
id: VAL-WO-0005
work-order: WO-0005
date: 2026-08-05
result: blocked
---

# Validation: WO-0005

**Update 2026-08-05 (rework):** result revised from `pass` to `blocked` under the refutation-stance evidence rules. The accessibility criteria (D-0013) make behavioral claims — keyboard access, visible focus, text contrast — but browser tooling was unavailable in both the implementation and validation sessions, so those checks never executed; they were passed on markup inspection. Per `INSTRUCTIONS.md`, unexecutable required checks are `blocked`, not passed. WO-0005 reverts to `done` pending re-validation with the Playwright + axe-core tooling decided in D-0018 (axe WCAG 2.2 AA scan, scripted keyboard/focus checks). All other criteria below stand on live executed evidence. Note: the branch had already merged to `main` before this rollback; the merge is not reverted.

Validated by a session that did not implement the work order. Live checks ran against local Docker PostgreSQL and a production build on port 3100 with seeded operator and viewer accounts (test users, observations, and server removed afterwards; DB left at 10 seeded KPIs, 0 observations). Checks were server-rendered-markup based (curl + HTML inspection), consistent with the WO's own evidence note that browser screenshot tooling was unavailable.

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0001.R2.AC1-AC4 (KPI admin UI) | pass | `/admin/kpis` renders the definitions list (seeded KPI names present) and an edit/create form capturing all R1 fields (name, category, unit, target, interval, description, source URLs) wired to `POST /api/kpis` / `PUT /api/kpis/[id]` (`src/components/forms/kpi-admin-workspace.tsx`); selecting a KPI shows source URLs, target, unit, category, interval |
| BRD-0003.R3.AC1 (grouped/filterable by category) | pass | Category segmented control with `aria-pressed` filtering (`src/components/dashboard/category-filter.tsx`); all 5 seeded categories rendered live |
| BRD-0003.R3.AC2 (latest value display) | pass | Live: card showed latest value "47 percent", region "Ethiopia", observed date, confidence, and a "Review flagged" status badge (`src/components/dashboard/kpi-card.tsx`) |
| BRD-0003.R3.AC3 (empty state) | pass | Live with 0 observations: all 10 cards showed a "No observation" badge and "Waiting for the first accepted observation." empty state |
| BRD-0003.R4.AC1-AC2 (history + traceability) | pass | KPI detail renders an observation-history table; every row carries a source link (live: `statsethiopia.gov.et/...` and `worldbank.org/...` both present) |
| BRD-0003.R4.AC3 (flagged visually distinct) | pass | Live: history rows showed "Auto accepted" (success badge) vs "Review flagged" (warning badge) per `reviewFlag` |
| BRD-0003.R4.AC4 (no approve/reject) | pass | No buttons on the detail page; the only "reject" text is the explanatory sentence that approval/rejection are outside the MVP (per D-0011) |
| BRD-0003.R6.AC1-AC5 (page set) | pass | Build registers `/`, `/kpis/[id]`, `/admin/kpis`, `/pipeline`, `/login`, `/account` (matching D-0012); live: all returned 200 for the operator; login page renders sign-in form; account page shows name/email/role and sign-out |
| BRD-0003.R6.AC6 (viewer denial) | pass | Live: viewer nav omits "KPI Admin"/"Pipeline" (role-gated in `app-shell.tsx`); direct viewer requests to `/admin/kpis` and `/pipeline` → 307 redirect to `/` (server-side `canUseOperatorControls` guard in both pages); unauthenticated `/` → 307 to `/login?callbackUrl=%2F` |
| Design-token discipline | pass | No hardcoded colors or px literals in components/pages; new utility classes in `globals.css` compose semantic tokens (px values there are the token definitions and structural borders/focus rings) |
| Accessibility (D-0013) — structural | pass (by inspection) | Labelled form fields (`field-label` wrapping inputs), semantic tables, `aria-label`/`aria-labelledby`/`aria-pressed` usage, focus-ring styles in `globals.css` |
| Accessibility (D-0013) — behavioral (keyboard access, visible focus, contrast) | blocked | Browser tooling unavailable; checks never executed — markup inspection cannot substitute for behavioral evidence |
| Testing plan | pass | `npm run lint` clean; `npm test` 48/48 across 14 files; `npm run build` succeeds with all 15 routes registered |
| Registry | pass | UNIT-0024 … UNIT-0034 files exist and are indexed; UNIT-0002/0009 updated for the extended home page and login-aware middleware |

## Drift observed
None against BRDs, BP-0001, D-0011, D-0012, or D-0013. Notes:

1. `prisma/seed.mjs`'s operator upsert only updates `role` on an existing user, not the password — if `operator@example.local` already exists with a different password, `SEED_OPERATOR_PASSWORD` silently has no effect (encountered during validation; worked around by direct DB update). Minor dev-tooling quirk, worth fixing opportunistically.
2. Admin UI offers list/create/edit/view per BRD-0001.R2; KPI deletion exists only at API level — consistent with R2's ACs, noted for completeness.

## Failures
None. One criterion group is `blocked` (behavioral accessibility, above) — not failed; nothing to fix in code until the checks can run or are waived.

## Merge status
Released for merge after user validation/review; merged to `main`. Status later reverted to `done` (see update note above) — the merge stands, only the validation verdict is withdrawn pending the blocked checks.
