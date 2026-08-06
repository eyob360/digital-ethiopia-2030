---
id: VAL-WO-0014
work-order: WO-0014
date: 2026-08-06
result: pass
---

# Validation: WO-0014

Fresh validator session (separate from the implementer), refutation stance, at `cbe91a3` on `wo-0014-config-hardening-and-test-hygiene` (4 commits off the WO-0013 branch tip `ff311e2` — the base is the unmerged-but-validated WO-0013 branch, not `main`). Maintenance WO (`implements: none`): verified the testing plan and summary objective. Security-sensitive: the ingestion-key comparison is auth code — merge waits for user review per convention, on top of WO-0013's own pending review.

Static suite at HEAD: `npm run lint` clean, `npm test` 23 files / 106 tests pass, `npm run build` succeeds, `npm run format` clean (implementor's claim confirmed).

| Criterion (testing plan / summary objective) | Verdict | Evidence |
| --- | --- | --- |
| Timing-safe key compare: correct construction | pass (by inspection — see note below) | `src/server/api/ingestion-auth.ts:7-16`: SHA-256 digest of **both** sides (`utf8`), `timingSafeEqual` on the two fixed 32-byte digests. No pre-comparison length branch exists anywhere in the file; no string-compare remnant (`!==` gone; the only conditional is `!token \|\| !timingSafeStringEqual(...)`, and `!token` depends solely on attacker-supplied input, never the secret — the `Bearer\s+(.+)` regex means token is undefined or non-empty, never ""). |
| Fail-closed when key unconfigured | pass (executed + inspection) | `!configuredKey` catches unset **and** empty-string `INGESTION_API_KEY` → 500 `"INGESTION_API_KEY is not configured"`, never proceeds to compare (`ingestion-auth.ts:21-29`). Unset case executed by test "fails clearly when the ingestion API key is not configured" (`ingestion-auth.test.ts:5-20`). |
| Response codes/messages unchanged vs base | pass (executed diff) | `git show ff311e2:src/server/api/ingestion-auth.ts` vs HEAD: 500/401 statuses and both error strings byte-identical; only the comparison mechanism changed. |
| Auth behavior: wrong/missing key → 401, correct key → 200, incl. mismatched lengths | pass (executed, twice) | Unit tests: same-length wrong ("local-kez"), shorter, longer, no header, non-Bearer scheme → all 401; matching → ok (`ingestion-auth.test.ts:22-72`). Live route (next dev on :3002, GET `/api/ingestion/kpis`): no header → 401 `{"error":"Invalid ingestion API key"}`; `Basic` scheme → 401; wrong key → 401; same-length wrong key (real key with every char replaced) → 401; valid key from `.env` → 200 with KPI JSON body. |
| Timing-safety falsifiability (mutation) | documented limitation, not a failure | Mutation: reverted the compare to `token !== configuredKey` → all 3 auth tests **still pass** (a string compare rejects the same inputs; timing is invisible to behavioral assertions). Timing safety is inherently a structural claim here — it rests on the inspection above (digest + `timingSafeEqual`, no length path), which per validation instructions may pass "by inspection". Future validators: re-inspect the file; do not expect a red test from this mutation. Reverted byte-identical. |
| `DATABASE_URL` fallbacks removed everywhere scoped | pass (executed grep + diff) | Fallback URL gone from `src/lib/prisma.ts`, `prisma/seed.mjs`, and `prisma.config.ts` (all throw the same clear message). Repo-wide grep for `postgres:postgres@localhost` finds only: `.env.example` (documentation — correct), the WO doc, and `e2e/validation-data.mjs:16-17` — a **remnant in an unscoped file**, see Drift observed. |
| Unset `DATABASE_URL` → clear throw (client import, seed, CLI) | pass (executed, all three) | From a cwd without `.env`, `env -u DATABASE_URL`: (a) `import('src/lib/prisma.ts')` under Node 24 → throws `"DATABASE_URL is not set. Configure it in your environment or .env file (see .env.example)."`; (b) `node prisma/seed.mjs` → same message, exit 1; (c) repo `.env` stashed, `npx prisma validate` → CLI fails loading `prisma.config.ts` with the same message (`.env` restored after). |
| `.env` present → everything works; env var wins over `.env` | pass (executed) | Shell-unset `DATABASE_URL` + repo `.env`: `npm run db:seed` → "The seed command has been executed" (exit 0), via `process.loadEnvFile()` in `prisma.config.ts`/`seed.mjs`. Precedence: `DATABASE_URL` preset to a sentinel, then `process.loadEnvFile()` in the repo cwd → sentinel survives (loadEnvFile does not override already-set vars). |
| Vitest fake-URL approach cannot mask a real connection | pass (executed, right-reason check) | `vitest.config.mts` sets `test.env.DATABASE_URL` to `postgresql://vitest:vitest@localhost:5432/vitest_fake_db`. The running dev postgres (checked via `psql -l` in the compose container) has **no** `vitest_fake_db` database and no `vitest` role — any test issuing a real query would error, and the 106-test suite is green. Prisma connects lazily, so module-load with the fake URL is inert; tests pass mocked clients throughout. |
| Rebuilt test: observations "no overwrite" can fail | pass (executed mutation) | Mutated `appendAcceptedObservation` (`src/server/observations.ts:68`) to `upsert` keyed on `kpiId` → test fails exactly as designed: `expected [ { id: 'obs-1', … } ] to have a length of 2 but got 1` (the in-memory mock table's `upsert` really mutates the row). Matches the implementor's recorded red check. Reverted byte-identical (`git status` clean). |
| Rebuilt test: workflow-export structural assertions can fail | pass (executed mutation) | Removed the `Authorization` header from the `Store Observation` node in `n8n/workflows/digital-ethiopia-ingestion.json` → "runs hourly and uses app ingestion API boundaries" fails with a node-named message (`Store Observation: expected [] to deep equally contain { name: 'Authorization', … }`); 10 other tests unaffected. The test now asserts an exact node-set equality against a per-node endpoint map (URL expression, POST, header object) plus per-node `jsCode` checks for `documentsProcessed`/`return []` — no `JSON.stringify(...).toContain` remnants on the app-boundary/budget/drop checks. Reverted byte-identical. |
| Rebuilt test: dashboard history assertions can fail | pass (executed mutations, both) | Mutation A: `getKpiHistory` returns raw rows instead of `observations.map(serializeObservation)` → "returns KPI history as a serialized time series in query order" fails. Mutation B: drop the `orderBy` clause from the query → same test fails. Both reverted byte-identical. Base comparison (`git show ff311e2:src/server/dashboard.test.ts`): the history test previously asserted **only** the `findMany` call args — the real weak spot the WO named, now closed with mapping/serialization/order assertions on real rows; `getDashboardKpis` full-shape `toEqual` incl. a no-observations KPI → nulls, and `kpiObservation.findMany` not called on the dashboard path. |
| `foundation.test.ts` deletion justified | pass (by inspection) | Base file asserted `expect("Digital Ethiopia 2030").toContain("Ethiopia")` — a string-literal tautology testing nothing real, exactly as the WO describes. Deletion, not rebuild, is the right call. |
| Scope discipline (`ff311e2..HEAD`) | pass | 15 files changed; every one traces to a scoped item, a documented extension, or workflow bookkeeping. `src/server/pipeline.test.ts` diff is a pure re-wrap (format-only, documented as trivial adjacent). `vitest.config.mts` is a necessary consequence of the fail-loud client. n8n workflow JSON untouched by the WO (not in the diff). Registry UNIT-0005/UNIT-0035 descriptions match the new code; UNIT-0017/0018/0039 interfaces unchanged (test-only touches), correctly left alone. |

## Documented in-spirit extensions — both assessed acceptable-for-maintenance

1. **`prisma.config.ts` same-defect fix.** Identical silent fallback, not listed in the WO's scope. Leaving it would have kept `db:reset`/`migrate` on the hidden localhost default, directly undermining the WO's own summary objective ("remove unsafe defaults") and its testing-plan item about `db:seed`/`db:reset` docs. Same defect, same file family, same fix — in spirit, not drift.
2. **Stale-WO-text note on `dashboard.test.ts`.** Verified: at `ff311e2` the dashboard KPI test already asserted more than `orderBy` (WO-0013 had upgraded it); the WO text predates that. The genuinely weak spot (history test asserting only call args) was real at base and is now fixed. Accurately documented, no scope creep.

## Drift observed

None against BRDs, blueprint, or decisions (D-0001–D-0021 scanned; no new dependencies — `process.loadEnvFile` and `node:crypto` are Node builtins). Residuals, reported not fixed:

1. **`e2e/validation-data.mjs:16-17` retains the hardcoded `postgresql://postgres:postgres@localhost:5432/...` fallback** — the same defect class the WO removed elsewhere. It was never in the WO's scope (a manual e2e data harness from VAL-WO-0005 re-validation, not app runtime or an npm script), so this does not fail the WO — but the implementor's own "same defect, adjacent fix" rationale for `prisma.config.ts` applies equally here. Recommend a trivial follow-up fix (Core rule 4 trivial class).
2. `process.loadEnvFile()` requires Node ≥ 21.7 and `package.json` declares no `engines` field (pre-existing absence, not introduced by this WO). On older Node the seed/CLI would crash with a `TypeError` rather than the clear message. Local toolchain is Node 24; note only.
3. The four n8n runtime drift items in STATE.md (VAL-WO-0010) remain open and untouched by this WO, as the implementation record states.

## Duplication

No new units created, nothing to register. The in-memory mutating mock table lives inside `observations.test.ts` only; no overlap with registry entries or other test helpers. Registry paths for UNIT-0005/UNIT-0035 verified real and descriptions current.

## Failures

None. WO-0014 set to `validated`. Merge note: **two** pending user reviews gate landing this — WO-0013 (core business rules, validated but held on its branch) and WO-0014 itself (auth code). This branch is stacked on WO-0013's, so the review/merge order is WO-0013 first, then WO-0014.

## Repeat procedure (for future validators)

All mutation checks are `python3` string/JSON edits + `npx vitest run <file>` + `git checkout -- <file>`; targets and expected red messages are in the table. Live auth check: `npm run dev` (mind the port announced in the log), curl `GET /api/ingestion/kpis` with no/wrong/same-length-wrong/valid `Authorization: Bearer` (key from `.env`). Fail-loud checks: run from a cwd without `.env`, `env -u DATABASE_URL` around (a) a dynamic import of `src/lib/prisma.ts`, (b) `node prisma/seed.mjs`, (c) `npx prisma validate` with the repo `.env` temporarily moved aside.
