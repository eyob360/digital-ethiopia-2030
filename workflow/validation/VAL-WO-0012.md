---
id: VAL-WO-0012
work-order: WO-0012
date: 2026-08-06
result: pass
---

# Validation: WO-0012

Refutation-stance validation by a fresh session (implementer was a different session). Two rounds, same validator session:

- **Round 1 (2026-08-06, at `40b1683`): fail** — one failure (F1, guard evasion); everything else held.
- **Round 2 (2026-08-06, at fix commit `8ddead5`): pass** — F1 resolved with executed evidence; all round-1 passes re-confirmed to stand (the fix diff touches only `src/lib/dependency-guard.test.ts` and doc statuses, so no other verdict was disturbed).

| Criterion | Verdict | Evidence |
|---|---|---|
| Static suite (`npm run lint`, `npm test`, `npm run build`) | pass | Round 2 at `8ddead5`: lint exit 0; 23 files / 95 tests pass; build exit 0 |
| BRD-0001.N1.AC1 — system currently avoids forbidden dependency categories | pass | Executed: guard test 1 passes against the real `package.json`; independent read of the manifest (25 deps) confirms nothing in any forbidden category; no new token collides with a current dependency (95/95 pass proves it executed) |
| BRD-0001.N1.AC1 — guard trips on injection (testing plan) | pass | Executed mutations (procedure below). Round 1: injecting `kafkajs`, `@qdrant/js-client-rest`, `@google-cloud/bigquery`, `serpapi` each made the guard fail; allowlisted `openai` did not. Round 2: injecting `@zilliz/milvus2-sdk-node` (the F1 evader) into the real manifest made the guard fail. `package.json` restored byte-identical each time (sha256 `8ff74c…3770` before and after) |
| BRD-0001.N1.AC1 — guard fails "if package.json gains dependencies in forbidden categories" (WO in-scope deliverable) | pass (round 2; F1 resolved) | Round-1 F1 (official Milvus client `@zilliz/milvus2-sdk-node` and LanceDB's `vectordb` evaded the token matcher) fixed at `8ddead5`: tokens `milvus2`/`zilliz`/`vectordb` plus breadth tokens `vector`, `kinesis`, `bee`, `agenda`, `duckdb`, `firecrawl`, `exa`, `serper`, `crawlbase` added; injection test extended to the real npm names. Round-2 probes (below) confirm every round-1 evader now flags in its correct category |
| Forbidden-category list faithful to AC text + D-0020 | pass (by inspection) | 4 categories map to AC1's 4 clauses; allowlist unchanged by the fix — exact-match `openai`/`tavily`/`@tavily/core` only (D-0020, D-0007, D-0014) — no over-permitting path; benign-package false positives (`spark-md5`, `@js-temporal/polyfill` flag as "distributed processing") are the documented fail-loud design, resolved via allowlist |
| BRD-0003.N1.AC1 — heavy logic stays in backend/pipeline layer | pass (by inspection, independently re-performed round 1; untouched by fix diff) | All 18 non-test UI files under `src/app` (excl. `api`) + `src/components` enumerated and grepped for `confiden\|threshold\|normaliz\|latest\|observation` and `.sort(\|.filter(\|.reduce(\|Math.\|toFixed\|parseFloat\|Number(\|parseInt`; every hit read. Confidence gate only in `src/lib/pipeline/confidence.ts`; normalization only in `src/lib/pipeline/normalization.ts`; sole importer of both is `src/server/observations.ts` (repo-wide grep). Latest-observation selection (`orderBy createdAt desc, take 1`) and target-progress derivation only in `src/server/dashboard.ts:8–16,51–77`. UI hits are presentation-only: percent/date formatting (`kpi-card.tsx:67,90–96`; `kpis/[id]/page.tsx:112,142–148`), summary counts (`page.tsx:11–13`), display-only category filter (`category-filter.tsx:16`), form-input parsing + alphabetical sort in admin forms (`kpi-admin-workspace.tsx:66–90`, `url-filter-config-workspace.tsx:125–129`). The one UI `@/lib/pipeline` import (`admin/url-filter/page.tsx:6`) is `defaultBlockedDomainCategories`, a constant `Record` (`src/lib/pipeline/url-filter.ts:21`) — data, not logic |
| Duplication check | pass | Test-only WO; `units-touched: []` correct. No registry entry covers dependency guarding; no same-WO duplication. Fix diff added no new units |

## Repeatable procedures

**Mutation experiment:** back up `package.json` (sha256 `8ff74c6df2d12541ca8e9b361c964ff3cb7f6969e03213ec9cb8d82a3305f770`); add `"<name>": "1.0.0"` to `dependencies` (JSON edit only, no install), run `npx vitest run src/lib/dependency-guard.test.ts`, restore the backup and verify the sha. Forbidden names (round 1: `kafkajs`, `@qdrant/js-client-rest`, `@google-cloud/bigquery`, `serpapi`; round 2: `@zilliz/milvus2-sdk-node`) → test file fails; allowlisted `openai` → 3/3 pass.

**Evasion/false-positive probe:** temporary test file importing `findForbiddenDependencies` from `src/lib/dependency-guard.test.ts`, calling it per name (file deleted after; not committed). Round-2 results at `8ddead5`:

- Flagged, correct category: `@zilliz/milvus2-sdk-node`, `vectordb`, `@upstash/vector` (vector database); `@aws-sdk/client-kinesis`, `bee-queue`, `agenda` (distributed processing); `duckdb` (data warehouse); `@mendable/firecrawl-js`, `exa-js`, `serper`, `crawlbase` (paid data API). Every round-1 evader now trips.
- Correctly NOT flagged (false-positive probes incl. near-miss tokens): `pg`, `natsort`, `axe-core`, `@axe-core/playwright` (vs `exa`), `beeswax` (vs `bee`), `exact-math` (vs `exa`), `vectorious` (vs `vector`).

**Residual, inherent limitation (not a failure):** the paid-API and hosted-DB space is open-ended (e.g. `@datastax/astra-db-ts`, `typesense` are not enumerated); the guard is defense-in-depth behind the project rule that every new dependency needs user approval first. The round-1 standard — mainstream npm clients of explicitly named products must flag — is met.

## Drift observed

None. Guard categories/allowlist match BRD-0001.N1.AC1 as revised by D-0020; consistent with D-0007, D-0014, D-0016, D-0018 (Playwright/axe devDependencies pass the guard); no contradiction with BP-0001. Full testing-policy tier (build + full tests) executed both rounds.

## Failures

None open. **F1 (round 1, resolved at `8ddead5`):** the token matcher missed the real npm clients of two products the guard names — `@zilliz/milvus2-sdk-node` (official Milvus JS client; tokenizes to `milvus2`, list had only `milvus`) and `vectordb` (LanceDB's npm package). Fixed by the token additions and real-name injection cases above; resolution verified in round 2 with executed probe and mutation evidence.

## Note for the orchestrator

WO-0012 is `validated`. Per D-0017 (premature-promotion rework), no BRD status was changed by this validation. Recommendation: BRD-0001 and BRD-0003 may progress toward `implemented`/`validated` only once their remaining fix WOs' validations are in (see STATE.md — e.g. the WO-0005 success-badge contrast fix noted in VAL-WO-0005 and the outstanding items under Blocked); the orchestrator should make that call, not this report.
