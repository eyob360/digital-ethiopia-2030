---
id: WO-0014
title: Config fail-loud, timing-safe key compare, and test hygiene
implements: none
blueprint: none
depends-on: [WO-0013]
units-touched: []
status: draft
---

# WO-0014: Config fail-loud, timing-safe key compare, and test hygiene

## Summary
Maintenance (no new business requirement — quality residue from the MVP build, per D-0017): remove unsafe defaults, harden the ingestion-key comparison, and fix or delete tests that cannot fail.

**Sensitive area:** the ingestion-key comparison is auth code — per conventions this WO waits for user review before merge, even after validation passes.

## In scope
- **Fail loudly on missing `DATABASE_URL`:** `src/lib/prisma.ts:10` and `prisma/seed.mjs:8` silently fall back to `postgresql://postgres:postgres@localhost:5432/...` when `DATABASE_URL` is unset. Remove the fallbacks; throw with a clear message instead (`.env.example` already documents the variable).
- **Timing-safe ingestion key compare:** `src/server/api/ingestion-auth.ts:22` compares the bearer token with `!==`. Use a constant-time comparison (`crypto.timingSafeEqual` over equal-length buffers, with length handling that doesn't reintroduce a timing signal).
- **Assertion-free tests — make falsifiable or delete:**
  - `foundation.test.ts` — asserts against a string literal (tests nothing real).
  - `observations.test.ts` "no overwrite" case — the mock lacks `update`/`delete` entirely, so the assertion is unfalsifiable; rebuild it to detect an overwrite if one occurred.
  - `workflow-export.test.ts` — string-search assertions; replace with structural assertions on the parsed workflow JSON (nodes, wiring, settings). Coordinate with the assertions WO-0009/0010/0013 add.
  - `dashboard.test.ts` — asserts only `orderBy`; assert the actual selection/shape behavior of `getDashboardKpis`.

## Out of scope
- New auth features or key rotation.
- The duplication/unification items (WO-0013).

## Requirements
None (maintenance). Related for context: ingestion API auth was validated in VAL-WO-0006 ("missing/wrong bearer → 401") — behavior is unchanged, only the comparison hardened.

## Implementation notes
- Depends on WO-0013: the workflow-export and dashboard tests cover code WO-0013 rewires; fixing them after avoids churn.
- Touch points: UNIT-0005 (prisma client), UNIT-0035 (ingestion API auth); registry entries updated if interfaces change (they shouldn't).
- Verify `npm run db:seed`/`db:reset` docs still hold once seed requires `DATABASE_URL` (compose env supplies it).

## Testing plan
- `npm run lint`, `npm test`, `npm run build` (testing policy in `../brds/OVERVIEW.md`).
- Unset-`DATABASE_URL` run of client init/seed fails with the clear error (executed, not inspected).
- Auth tests still prove wrong/missing key → 401, correct key → 200, including mismatched-length keys.
- Each rebuilt test demonstrably fails when the behavior it guards is broken (mutate, observe red, revert).
