---
id: VAL-WO-0005
work-order: WO-0005
date: 2026-08-06
result: pass
---

# Validation: WO-0005

**Update 2026-08-06 (round 2 — pass):** the round-1 contrast failure below is **resolved** by `22947ae` (`--color-success: 150 59% 35%` → `150 59% 29%` in `src/app/globals.css` — a surgical one-token change; grep confirms the token's only style consumers are the `StatusBadge` tone classes). Independently recomputed contrast (8-bit quantized, not taken from the implementor): `text-success` over `bg-success/10` is **4.88:1** on the white card and **4.69:1** on the page background — both above the 4.5:1 AA minimum. Full harness re-run by this validator: **22/22 passed**, including the two previously-failing axe scans (KPI detail "Auto accepted", pipeline "Available"), with no new axe violations and all keyboard/focus assertions still green. Additionally, the round-1 coverage gap was closed with an executed check: the test data was flipped so an *auto-accepted* observation is latest (making the overview render the success badge — the exact state that failed in round 1's first run), and the overview axe scan passed. WO-0005 → `validated`. The round-1 record below is retained as history; its "Failures" section describes the now-fixed defect.

**Round 1, 2026-08-06 (re-validation with D-0018 tooling — superseded by round 2 above):** the previously `blocked` behavioral accessibility criteria were executed with Playwright + axe-core per D-0018, in a fresh session that did not implement the work order. Keyboard access and focus visibility **pass** on executed evidence. The axe WCAG 2.2 AA scan **fails**: the success-tone `StatusBadge` (`text-success` on `bg-success/10`, 12px semibold) has a text contrast of **3.66:1**, below the 4.5:1 minimum of WCAG 2.2 AA SC 1.4.3 — a `serious` axe `color-contrast` violation on every MVP page that renders an "Auto accepted"/"Available" badge. Result revised `blocked` → `fail`; WO-0005 returns to `in-progress`. All functional criteria re-passed on executed browser evidence in the same run.

**Environment/evidence (repeatable):** local Docker PostgreSQL (`docker compose up -d`), `SEED_OPERATOR_PASSWORD=<pw> npm run db:seed`, `node e2e/validation-data.mjs setup` (viewer user + one auto-accepted and one review-flagged observation on "Digital economy share of GDP"), then `npx playwright test` (config starts `npm run dev` on port 3210 — port 3000 was occupied by an unrelated app). Harness committed in-repo: `playwright.config.ts`, `e2e/helpers.ts`, `e2e/dashboard-ui.spec.ts`, `e2e/accessibility.spec.ts`, `e2e/validation-data.mjs`; it is not part of `npm test` (vitest includes `src/**` only). Teardown ran after: DB left at 10 seeded KPIs, 0 observations, 0 users. Final run: 20 passed / 2 failed (both failures = the contrast violation). The app has a single light theme — no dark-mode variant exists to scan.

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0001.R2.AC1 (list definitions) | pass | e2e `dashboard-ui.spec.ts` "KPI admin lists definitions" — seeded KPI listed at `/admin/kpis` |
| BRD-0001.R2.AC2 (create captures R1 fields) | pass | e2e "creates and edits definitions" — created a KPI via the form (name, category, unit, target, interval, description, source URLs), API-confirmed |
| BRD-0001.R2.AC3 (edit persists) | pass | same test — edited description survives a page reload |
| BRD-0001.R2.AC4 (view shows source URLs, target, unit, category, interval) | pass | e2e asserts all five field values for the selected definition |
| BRD-0003.R3.AC1 (grouped/filterable by category) | pass | e2e "overview groups/filters" — category button filters cards, `aria-pressed` toggles, only matching-category cards remain |
| BRD-0003.R3.AC2 (latest value, unit, region, date, confidence/review status) | pass | e2e asserts "47", "percent", "Ethiopia", "Jun 30, 2026", "45%", "Review flagged" on the card |
| BRD-0003.R3.AC3 (empty state) | pass | e2e — "No observation" badge + "Waiting for the first accepted observation." on unobserved KPIs |
| BRD-0003.R4.AC1 (history) | pass | e2e — detail page history table shows both observations |
| BRD-0003.R4.AC2 (source traceability) | pass | e2e — per-row Source links carry the two distinct source URLs |
| BRD-0003.R4.AC3 (flagged visibly distinct) | pass* | e2e — "Review flagged" (warning) vs "Auto accepted" (success) badges both visible. *Distinction exists, but the success badge itself fails contrast (below) |
| BRD-0003.R4.AC4 (no approve/reject) | pass | e2e — zero buttons/links matching /approve\|reject/i on the detail page (operator and viewer) |
| BRD-0003.R6.AC1–AC5 (page set per D-0012) | pass | e2e — `/`, `/kpis/[id]`, `/admin/kpis`, `/pipeline`, `/account`, `/login` all render for the operator; sign-in and sign-out flows executed; unauthenticated `/` redirects to `/login`; wrong password shows an error |
| BRD-0003.R6.AC6 (viewer hidden/denied) | pass | e2e — viewer nav lacks KPI Admin/Pipeline; direct viewer visits to both redirect to `/`; viewer retains read access to overview/detail |
| Accessibility (D-0013/D-0018) — keyboard access | pass | e2e `accessibility.spec.ts` — login form fully keyboard-operable (Tab order, Enter submit); nav links, category filter (Enter toggles `aria-pressed`), admin fields, and history source links all keyboard reachable |
| Accessibility (D-0013/D-0018) — visible focus | pass | e2e — every keyboard-focused element painted a non-none outline/box-shadow (computed-style assertion) |
| Accessibility (D-0013/D-0018) — axe WCAG 2.2 AA | pass (round 2; failed round 1) | Round 1: `color-contrast` (serious) on the success `StatusBadge` — KPI detail, pipeline, and overview when a success badge renders. Round 2 after `22947ae`: all six page scans clean, including an extra overview scan with the success badge rendered |
| Testing plan (lint/test/build) | pass | `npm run lint` clean, `npm test` 78/78 (20 files), `npm run build` all routes — re-run with the harness files present |
| Registry | pass | UNIT-0002/0009/0024–0034 all indexed and pointing at existing paths |
| Design-token discipline | pass | no hardcoded hex/rgb/px in `src/**/*.tsx` (grep) |

## Failures

None open. The single round-1 failure below was fixed by `22947ae` and re-verified with executed evidence in round 2 (see the update at the top).

1. *(Resolved 2026-08-06, round 2)* **WCAG 2.2 AA SC 1.4.3 (contrast) — success `StatusBadge` tone.** `src/components/dashboard/status-badge.tsx:8` — `success: "border-success/30 bg-success/10 text-success"`. `--color-success: 150 59% 35%` at 12px (`text-xs`) semibold over `bg-success/10` on a white card computes to **3.66:1**; the AA minimum for non-large text is 4.5:1. Axe flags it `serious` on every page rendering the badge: dashboard overview (when an auto-accepted observation is latest), KPI detail history ("Auto accepted"), pipeline ("Available"). Fix direction (implementer's choice): darken `--color-success` to ≥ 4.5:1 over the badge background (e.g. reduce lightness to ~30% or less — verify with the committed axe suite), or use dark foreground text on the success badge as the warning tone already does. Re-run `npx playwright test e2e/accessibility.spec.ts` (with an auto-accepted observation as the latest, so the overview badge is exercised — `node e2e/validation-data.mjs setup` provides one on the detail page) to confirm.

*(Round-1 disposition, superseded: WO-0005 went back to `in-progress` pending the contrast fix; round 2 validated the fix and the WO is `validated`.)*

## Drift observed

None against BRDs, BP-0001, or decisions (D-0010, D-0011, D-0012, D-0013, D-0016, D-0018 all conform; the Playwright/axe devDependencies are the ones D-0018 approved). Notes, none blocking:

1. (Carried from 2026-08-05, still unfixed) `prisma/seed.mjs` operator upsert updates only `role` on an existing user, so `SEED_OPERATOR_PASSWORD` has no effect if the user already exists. Dev-tooling quirk; candidate for WO-0014-style hygiene work.
2. `npm run format` fails on `src/server/pipeline.test.ts` — pre-existing on `main` (not introduced by WO-0005 or this validation); overlaps WO-0014 (test hygiene).
3. Minor same-WO duplication: identical `formatDate`/`formatPercent` helpers in `src/components/dashboard/kpi-card.tsx` and `src/app/kpis/[id]/page.tsx` (plus a sibling `formatDateTime` in `pipeline-controls.tsx`). Cosmetic; could fold into one util when next touched.
4. The pipeline page shows lock state, start/complete/release controls, and the eligible batch, but no run-history list; BRD-0003.R6.AC4 says "pipeline status/runs page". Read as satisfied (it is where an operator monitors ingestion operations, matching D-0012's "pipeline status"), noted for completeness.

## Merge status

WO-0005's original branch was merged to `main` before the 2026-08-05 rollback; that merge stands. The round-2 material (e2e harness, contrast fix `22947ae`, this report) sits on branch `wo-0005-dashboard-ui`, validated and awaiting merge per the branch lifecycle. UI code touches auth-gated pages, so per the review convention the user reviews before merge.
