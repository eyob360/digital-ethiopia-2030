---
id: VAL-WO-0012
work-order: WO-0012
date: 2026-08-06
result: fail
---

# Validation: WO-0012

Refutation-stance validation by a fresh session (implementer was a different session). Static suite, guard-mutation experiments, an independent re-performance of the separation inspection, and evasion probes against the guard's matcher. One failure (F1); everything else held.

| Criterion | Verdict | Evidence |
|---|---|---|
| Static suite (`npm run lint`, `npm test`, `npm run build`) | pass | lint clean; 23 files / 95 tests pass incl. 3 guard tests; build exit 0 (2026-08-06, branch `wo-0012-…` @ 40b1683) |
| BRD-0001.N1.AC1 — system currently avoids forbidden dependency categories | pass | Executed: `src/lib/dependency-guard.test.ts` test 1 passes against the real `package.json`; independent read of `package.json` (25 deps) confirms nothing in any forbidden category |
| BRD-0001.N1.AC1 — guard trips on injection (testing plan) | pass | Executed mutations (procedure below): injecting `kafkajs`, `@qdrant/js-client-rest`, `@google-cloud/bigquery`, `serpapi` into `dependencies` each made `npm test` fail; allowlisted `openai` did not; `package.json` restored byte-identical (sha256 `8ff74c…3770` before and after) |
| BRD-0001.N1.AC1 — guard fails "if package.json gains dependencies in forbidden categories" (WO in-scope deliverable) | **fail** | Executed probes (procedure below): `@zilliz/milvus2-sdk-node` (official Milvus JS client) and `vectordb` (LanceDB's npm package) are NOT flagged — both are mainstream clients of products the guard's own token list names (`milvus`, `lancedb`). See F1 |
| Forbidden-category list faithful to AC text + D-0020 | pass (by inspection) | 4 categories map to AC1's 4 clauses; allowlist is exact-match `openai`/`tavily`/`@tavily/core` only (D-0020, D-0007, D-0014) — no over-permitting path; benign-package false positives (`spark-md5`, `@js-temporal/polyfill` both flag as "distributed processing") are the documented fail-loud design, resolved via allowlist |
| BRD-0003.N1.AC1 — heavy logic stays in backend/pipeline layer | pass (by inspection, independently re-performed) | All 18 non-test UI files under `src/app` (excl. `api`) + `src/components` enumerated and grepped for `confiden|threshold|normaliz|latest|observation` and `.sort(|.filter(|.reduce(|Math.|toFixed|parseFloat|Number(|parseInt`; every hit read. Confidence gate only in `src/lib/pipeline/confidence.ts`; normalization only in `src/lib/pipeline/normalization.ts`; sole importer of both is `src/server/observations.ts` (repo-wide grep). Latest-observation selection (`orderBy createdAt desc, take 1`) and target-progress derivation only in `src/server/dashboard.ts:8–16,51–77`. UI hits are presentation-only: percent/date formatting (`kpi-card.tsx:67,90–96`; `kpis/[id]/page.tsx:112,142–148`), summary counts (`page.tsx:11–13`), display-only category filter (`category-filter.tsx:16`), form-input parsing + alphabetical sort in admin forms (`kpi-admin-workspace.tsx:66–90`, `url-filter-config-workspace.tsx:125–129`). The one UI `@/lib/pipeline` import (`admin/url-filter/page.tsx:6`) is `defaultBlockedDomainCategories`, a constant `Record` (`src/lib/pipeline/url-filter.ts:21`) — data, not logic |
| Duplication check | pass | Test-only WO; `units-touched: []` correct. No registry entry covers dependency guarding; registry catalogues runtime units, and no other test file is registered. No same-WO duplication (single new file) |

## Repeatable procedures

**Mutation experiment:** back up `package.json` (sha256 `8ff74c6df2d12541ca8e9b361c964ff3cb7f6969e03213ec9cb8d82a3305f770`); for each candidate name, add `"<name>": "1.0.0"` to `dependencies` (JSON edit only, no install), run `npx vitest run src/lib/dependency-guard.test.ts`, restore the backup. Forbidden names → test file fails; `openai` → 3/3 pass.

**Evasion probe:** temporary test file importing `findForbiddenDependencies` from `src/lib/dependency-guard.test.ts`, calling it on each probe name (file deleted after; not committed). Results:

- NOT flagged, same-category as listed products: `@zilliz/milvus2-sdk-node` (Milvus), `vectordb` (LanceDB) — **F1**.
- NOT flagged, category breadth gaps (documented weaknesses, not failures): `@upstash/vector` (hosted vector DB); `@aws-sdk/client-kinesis` (managed streaming); `bee-queue`, `agenda` (job queues — `bull`/`bullmq` are listed); `duckdb` (embedded OLAP — arguably outside "warehouse client"); `@mendable/firecrawl-js`, `exa-js`, `serper`, `crawlbase` (paid data APIs — this category is inherently open-ended; the guard is defense-in-depth behind the project rule that every new dependency needs user approval).
- Correctly flagged: `kafka-node`, `nats.ws`, `@aws-sdk/client-athena`, `@databricks/sql`.
- Correctly not flagged: `pg`, `natsort`.
- False positives by design (fail-loud): `spark-md5`, `@js-temporal/polyfill`.

## Drift observed

None. Guard categories/allowlist match BRD-0001.N1.AC1 as revised by D-0020; consistent with D-0007, D-0014, D-0016, D-0018 (Playwright/axe devDependencies pass the guard); no contradiction with BP-0001. Full testing policy tier (build + full tests) executed.

## Failures

**F1 — Guard evasion for explicitly targeted products (BRD-0001.N1.AC1 deliverable).** The WO's in-scope claim — "a test that fails if `package.json` gains dependencies in forbidden categories" — is refuted by executed evidence: the official Milvus client `@zilliz/milvus2-sdk-node` (tokenizes to `zilliz,milvus2,sdk,node`; token list has only `milvus`) and LanceDB's npm package `vectordb` (single token `vectordb`; list has only `lancedb`/`vectra`) pass the guard unflagged. These are the packages a developer would actually install to use two products the guard explicitly names, so the guard gives false assurance about exactly what it claims to block.

**Fix (fresh session):** add tokens `zilliz`, `milvus2`, `vectordb` (and consider the breadth gaps above: `vector`, `kinesis`, `firecrawl`, `exa`, `serper`, `crawlbase`); extend the injection test with the real npm names `@zilliz/milvus2-sdk-node` and `vectordb` so the fix carries executed evidence. Everything else in this WO stands — the separation inspection and the current-tree compliance need no rework.

## Note for the orchestrator

The WO summary anticipates BRD-0001/BRD-0003 progressing to `implemented` after this WO and the fix WOs. Per D-0017 (premature-promotion rework), no BRD status was changed by this validation; promotion should wait until F1 is fixed, this WO re-validates, and the remaining fix WOs validate.
