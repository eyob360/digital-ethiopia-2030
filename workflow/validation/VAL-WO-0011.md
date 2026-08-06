---
id: VAL-WO-0011
work-order: WO-0011
date: 2026-08-06
result: pass
---

# Validation: WO-0011

Fresh validator session, refutation stance. Branch `wo-0011-configurable-url-filtering` at `15bd719` (2 commits ahead of `main@1fefdf0`). Live checks ran against the project docker Postgres (already running) and a dev server started for this validation (`npm run dev`, bound to port 3002 because an unrelated process held 3000). All executed evidence below is repeatable from this report alone; setup and teardown are documented at the bottom.

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0002.R4.AC3 (remove invalid domains per configured rules) | pass (executed) | Unit test `blocks each default category and invalid URLs` (`src/lib/pipeline/url-filter.test.ts:47`) drops `not-a-url` and `ftp://…`; live: every request below applied the configured rules through `POST /api/ingestion/url-filter`. |
| BRD-0002.R4.AC5 (default-block categories) | pass (executed) | Live POST with one representative per category — facebook.com, google.com/search, bit.ly, drive.google.com, login.microsoftonline.com, reddit.com — returned `{"urls":[]}`. Subdomains too: news.google.com, m.facebook.com, old.reddit.com → `{"urls":[]}`. Defaults grouped by AC5 category in `src/lib/pipeline/url-filter.ts:21` (`defaultBlockedDomainCategories`, 51 domains). |
| BRD-0002.R4.AC6 (default-allow legitimate sources) | pass (executed) | Live POST with itu.int, gsma.com, un.org, ecc.gov.et, addisstandard.com, example.org → all 6 returned. The old hardcoded allowlist (the defect named in the WO) is gone; unlisted domains pass. |
| BRD-0002.R4.AC7 (operator-configurable without code changes) | pass (executed) | Full procedure below: authenticated operator `PUT /api/url-filter-config` changed live filter behavior on the same running server, both directions (new block, allow-over-default-block), then a second PUT reverted it. No restart, no redeploy, no code change. |
| AC1/AC4 cap + AC2 dedup preserved (out of scope, must not regress) | pass (executed) | Live POST of 8 URLs (one duplicate pair `www.itu.int/a#frag` / `itu.int/a`) with `maxUrls:5` → exactly 5 URLs, duplicate collapsed. Unit test `deduplicates valid URLs and caps output at five` (`url-filter.test.ts:5`). |
| Operator role gating (D-0010) | pass (executed) | Viewer session `PUT /api/url-filter-config` → 403 `{"error":"Insufficient permissions"}`; viewer GET → 403; anonymous PUT → 307 (proxy redirect, `src/proxy.ts` matcher); config verified unchanged after the viewer attempt. Page: viewer GET `/admin/url-filter` → 307 redirect to `/` — byte-identical behavior to the existing `/admin/kpis` gate (also 307 → `/`); anonymous → 307 to `/login?callbackUrl=%2Fadmin%2Furl-filter`; operator → 200 with the form rendered and stored config prefilled (`ena.et`, `medium.com` present in HTML during the AC7 window). |
| Ingestion auth unchanged | pass (executed) | Wrong bearer key on `/api/ingestion/url-filter` → 401; route-level test `rejects requests without a valid ingestion API key` (`src/app/api/ingestion/url-filter/route.test.ts:65`) also asserts no DB config read on auth failure. |
| n8n contract stability | pass (by inspection) | `Filter Search URLs` node (`n8n/workflows/digital-ethiopia-ingestion.json:666-688`) sends `{"urls": [...], "maxUrls": 5}` with `Bearer $env.INGESTION_API_KEY`; route still accepts exactly that shape and responds `{urls: [{url, hostname}]}`; `Expand Filtered URLs` reads `$json.urls` / `item.url`. Request-supplied `allowedDomains`/`blockedDomains`/`maxUrls` handling is unchanged from `main` (diffed `git show main:src/app/api/ingestion/url-filter/route.ts`); the only route change is merging in the stored operator config. No workflow JSON change needed or made. |
| Migration additive-only, applied | pass (executed) | `prisma/migrations/0004_url_filter_config/migration.sql` is a single CREATE TABLE (no alters/drops), matching project style (snake_case map, singleton `id` default `'default'`). `npx prisma migrate status` → "Database schema is up to date!" (4 migrations); `\d url_filter_configs` matches `prisma/schema.prisma` model `UrlFilterConfig`. |
| Tests can fail (mutation spot-check) | pass (executed) | Mutation 1: removed the `!isAllowed` guard (allow no longer wins) → 3 tests failed across `url-filter.test.ts` and `route.test.ts`. Mutation 2: removed `defaultBlockedDomains` from the block merge → 3 tests failed. Both reverted byte-identical (`git status` clean before commit). |
| Static suite | pass (executed) | `npm run lint` clean; `npm test` 22 files / 92 tests pass; `npm run build` succeeds, `/admin/url-filter` and `/api/url-filter-config` present as dynamic routes. |
| Config service behavior | pass (executed) | Service tests (`src/server/url-filter-config.test.ts`): parse normalizes pasted URLs/case/`www.`, dedups, rejects non-domain entries (whole-payload reject); missing row → empty overrides. Live: invalid PUT payload (`"not a domain !!"`) → 400. |
| Duplication / registry | pass (by inspection) | UNIT-0041–0044 registered with index lines and correct paths; no overlap with existing units (UNIT-0031 is the KPI-domain form; 0044 reuses field classes + UNIT-0001 Button rather than forking) and none among themselves (service / endpoint / page / component are distinct layers, each a thin consumer of the previous). UNIT-0011 and UNIT-0038 entries updated to describe the new policy and DB read. |

## Executed AC7 procedure (repeatable)

Setup: docker Postgres up (project compose); `SEED_OPERATOR_PASSWORD=<pw> npm run db:seed` (users table was empty, so the seed upsert quirk from VAL-WO-0005 did not bite); a VIEWER user inserted directly with the same `scrypt:` hash format as `src/lib/auth/password.ts`; dev server `npm run dev`. Sessions obtained via `GET /api/auth/csrf` + `POST /api/auth/callback/credentials` with cookie jars.

1. Operator `GET /api/url-filter-config` → `{config: {blockedDomains: [], allowedDomains: [], updatedAt: null}, defaultBlockedDomainCategories: {...}}` (no row yet).
2. Operator `PUT` `{"blockedDomains":["ena.et"],"allowedDomains":["https://www.Medium.com/some/path"]}` → 200, normalized to `{blockedDomains:["ena.et"], allowedDomains:["medium.com"]}` (URL pasted as-is was normalized to a bare domain).
3. Same running server, ingestion endpoint: POST urls `[ena.et/news/story, sub.ena.et/x, medium.com/@analyst/report, itu.int/pub]` → returned only `medium.com` + `itu.int`. Operator block rejected ena.et **and its subdomain**; operator allow overrode the default `medium.com` block (allow wins over defaults, D-0019).
4. `/admin/url-filter` as operator rendered the workspace with both overrides prefilled ("Additional blocked domains" / "Always-allowed domains" textareas, "Save configuration" button); the form submits the exact PUT exercised in step 2 (`src/components/forms/url-filter-config-workspace.tsx:30-37`).
5. Restore: operator `PUT` with empty lists → 200; same server immediately reverted — ena.et passed again, medium.com blocked again. No restart at any point.

Teardown: deleted the `url_filter_configs` row (table back to its pre-validation 0 rows), deleted both test users (users table back to 0 rows), stopped the dev server. Docker left as found (was already up).

## Drift observed

None blocking. Notes:

1. **Request-supplied override lists kept (backward compat).** The ingestion route still accepts `allowedDomains`/`blockedDomains` in the request body, merged additively with the stored config. This does not contradict D-0019 (which specifies the operator surface, not an exclusive one): the behavior is unchanged from `main`, the deployed n8n node sends neither, request lists can only add (never remove) operator entries, and the path is ingestion-key-gated. Caveat worth knowing: a future workflow-JSON edit could pass `allowedDomains` and win over an operator block — but that is itself a code change, outside AC7's persona.
2. **`maxUrls` in the request is caller-trusted** (a value > 5 raises the cap) — pre-existing on `main`, unchanged here, and the n8n node pins 5. Not a regression; noted for completeness.
3. **BRD-0002 bookkeeping** (carried from VAL-WO-0010 §Drift item 6): BRD-0002 sits in `ARCHIVE.md` as `validated` from the pre-rework MVP pass. With WO-0011 now validated, the R4 gap that made that status questionable is closed; remaining inconsistency is only WO-0010's merge hold. Status not touched here — the archived line already reads `validated` and there is nothing to flip.

## Failures

None.
