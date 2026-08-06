---
id: WO-0014
title: Config fail-loud, timing-safe key compare, and test hygiene
implements: none
blueprint: none
depends-on: [WO-0013]
units-touched: [UNIT-0005, UNIT-0035, UNIT-0017, UNIT-0018, UNIT-0039]
status: done
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

## Implementation record (2026-08-06)

Branch `wo-0014-config-hardening-and-test-hygiene`, cut from the WO-0013 branch tip `ff311e2` (WO-0013 is validated but held on its branch for user review; this WO's tests build on its rewiring). **This WO touches auth code — per conventions it waits for user review before merge, on top of WO-0013's own pending review.**

**DATABASE_URL fail-loud** (`src/lib/prisma.ts`, `prisma/seed.mjs`, plus one site the WO missed): fallbacks removed; both throw `"DATABASE_URL is not set. Configure it in your environment or .env file (see .env.example)."` **Adjacent same-defect fix:** `prisma.config.ts` carried the identical silent fallback (not listed in scope) — left in place it would have kept `db:reset`/`migrate` on the hidden localhost default, so it got the same treatment. Discovery during this: the Prisma 7 CLI does **not** load `.env` when evaluating `prisma.config.ts` or spawning the seed — the fallbacks were what made `npm run db:seed`/`db:reset` work from a plain shell. Both files now call `process.loadEnvFile()` (Node ≥21.7, no new dependency; does not override already-set env vars; missing file tolerated) before the check. Executed evidence: importing `prisma.ts`, running `seed.mjs` (cwd without `.env`), and `prisma validate` (repo `.env` stashed) all fail with the clear message when `DATABASE_URL` is unset; `npm run db:seed` with only `.env` (unset in shell) seeds successfully.

**Test-suite fallout of the fail-loud client:** vitest does not load `.env`, and most server tests transitively import `src/lib/prisma.ts` at module load. `vitest.config.mts` now sets `test.env.DATABASE_URL` to an explicitly fake URL (`postgresql://vitest:vitest@localhost:5432/vitest_fake_db`) — unit tests only ever pass mocked clients and never connect, so the fake URL satisfies module load without masking real misconfiguration.

**Timing-safe key compare** (`src/server/api/ingestion-auth.ts`): `!==` replaced by `timingSafeEqual` over SHA-256 digests of both sides. Length handling: hashing first yields fixed-length buffers, so no pre-comparison length check exists to leak a timing signal about the configured key's length; behavior (401/200/500 responses) is unchanged. Tests extended: same-length wrong key, shorter, longer, missing header, non-Bearer scheme → all 401; matching key → ok. (A trailing-whitespace token case was tried and dropped: the Fetch API trims header values before they reach the auth code, so it exercises header normalization, not the comparison.)

**Test hygiene** (each rebuilt test mutation-checked — behavior broken, red observed, reverted):
- `foundation.test.ts` deleted (asserted a string literal contains "Ethiopia").
- `observations.test.ts` "no overwrite": in-memory table behind a full mutating mock surface (`update`/`updateMany`/`upsert`/`delete`/`deleteMany` actually mutate the table); asserts two distinct rows with the first row's value intact and zero mutating calls. Red check: switching the service to upsert-by-kpiId fails it (row count 1).
- `workflow-export.test.ts`: the remaining `JSON.stringify(...).toContain(...)` searches replaced structurally — exact per-node app-boundary endpoint map (URL expression, POST, Authorization header object) with an exact node-set equality, and per-node `jsCode` checks for `documentsProcessed` / `return []`. All WO-0009/0010/0013 assertions (wiring, IF shapes, codegen byte-pin) untouched. Red checks: dropped header, retargeted URL, injected counter/`return []` each fail with node-named messages.
- `dashboard.test.ts`: full serialized dashboard shape via `toEqual` (incl. a no-observations KPI → nulls), `kpiObservation.findMany` not called for the dashboard path, zero-target case for `calculateTargetProgress`, and `getKpiHistory` mapping asserted on real rows (serialization + order) instead of only `orderBy` args. Red checks: dropping serialization and dropping the `observedDate` ordering each fail. (Note: at this branch's HEAD the dashboard test already asserted more than `orderBy` — the WO text predates WO-0013; the weak spots that remained were the history mapping and the empty/edge cases.)
- Trivial adjacent fix: `src/server/pipeline.test.ts` re-formatted (pre-existing `npm run format` warning; formatting itself was not a scoped item).

**Registry:** no interface changes; UNIT-0005 and UNIT-0035 descriptions updated (fallback removed / constant-time compare). Nothing new created, nothing to register.

**Testing:** `npm run lint`, `npm test` (23 files / 106 tests), `npm run build`, `npm run format` all pass. n8n workflow JSON untouched; the four runtime drift items in STATE.md are unaffected.
