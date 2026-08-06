---
id: VAL-WO-0010
work-order: WO-0010
date: 2026-08-06
result: pass
---

# Validation: WO-0010

Round 4, validating the S8 fix at `b8adf90` (`fix: terminate store-error lanes at branch completion`). Fresh validator session, separate from the implementer. Diff `6837c25..b8adf90` is surgical and matches the claimed scope exactly: `Store Raw Document`/`Store Observation` flipped to `onError: continueErrorOutput`, both error outputs wired to a new `Store Error Context` Code node (rehydrates via `contextFrom('Priority URLs First')`, tags `terminalReason: 'store-error'`) whose only output goes to `Complete Pipeline Run`, plus one new export test — nothing else touched. Static suite: `npm run lint` (clean), `npm test` (20 files / 78 tests), `npm run build` — all pass. No OpenAI/Tavily keys in this environment (same constraint as all prior rounds); runtime behavior tested with controlled replica experiments against the pinned n8n (`n8nio/n8n:2.33.0` from `docker-compose.yml`).

**Round-3's Failure 1 (S8 unbounded fallback loop) is fixed with executed evidence, and nothing round 3 passed has regressed.** Two *new pre-existing* runtime drift findings surfaced while probing with real HTTP store nodes (below) — both identical on `main`, outside WO-0010's routing scope, same family as round-3's Drift item 1.

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| BRD-0002.R1.AC1 (priority URLs checked before fallback) | pass (executed) | V1/V2/V3: priority fetches always precede any fallback node (V3 fetch order p0, p1, fb0). Export ordering assertions in `npm test` (`src/lib/n8n/workflow-export.test.ts`). |
| BRD-0002.R1.AC2 (valid observation → no fallback same run) | pass (executed) | V1: `status:"inserted"` → `Observation Accepted?` true → `Complete Pipeline Run` once (`runId:"run-v4"`, `branchKey:"kpi-1"`); `Mark Fallback Used`, query gen, Tavily, `Fallback Already Used?`, `Store Error Context` all 0 runs. |
| BRD-0002.R1.AC3 (no valid observation → continue to fallback) | pass (executed) | V2: `status:"rejected"` → fallback ran exactly once (`Mark Fallback Used` 1, `Store Observation` 2, `Fallback Already Used?` evaluated false-then-true), complete once with valid runId/branchKey, error lane 0 runs. V3: two priority URLs iterate (increment 1) then fall back once. |
| WO scope: fallback at most once per KPI — **incl. store-error items (round-3 Failure 1)** | **pass (executed)** | V4: store-observation endpoint genuinely erroring (real httpRequest node, HTTP 404 after 5 retries) → error item exits via output 1 → `Store Error Context` (1 run) → `Complete Pipeline Run` (1 run, valid runId/branchKey, `terminalReason:"store-error"`); `Observation Accepted?`, `More Priority URLs?`, `Fallback Already Used?`, `Mark Fallback Used`, query gen, Tavily: **0 runs — no re-arm, no loop**; execution status `success`. Same result on every other lane: V5 (direct-fallback lane, urls=0), V6 (rejection arms fallback once, then fallback store errors — `Mark Fallback Used` stays 1), V7 (`Store Raw Document` errors on priority lane — nothing downstream runs), V8 (fallback raw-doc store errors after rejection — no second fallback). |
| Error-lane context rehydration (runId/branchKey for completion) | pass (executed) | `Store Error Context` output carried `runId:"run-v4"`, `branchKey:"kpi-1"` (+ full `kpi`) on all four error lanes (V4–V8); the `Complete Pipeline Run` stub **throws** if either is missing and never threw. `Priority URLs First` runs on every lineage (topologically between `Expand KPI Batch` and `Has Priority URLs?`), so the back-reference is lineage-safe — confirmed executed on priority, direct-fallback, and post-rejection-fallback lineages. Round-3's paired-item degradation does not occur (error lane is few hops; no loop to degrade in). |
| D-0021(a): `Run Started?` lock gate (WO-0009) | pass (executed) | V0: `started:false` → `Expand KPI Batch` 0 runs. Conditional stand re-confirmed at `b8adf90`. |
| D-0021(b): dedup/relevance/priority branching (WO-0006) | pass (executed) | V1–V3: `New Document?`/`Relevant?`/`More Priority URLs?` route per status on every pass; store-node success output (index 0) still feeds `New Document?`/`Observation Accepted?` unchanged after the `onError` flip. Conditional stand re-confirmed. |
| New export test can fail (mutation checks) | pass (executed mutations) | Mutation 1 (`Store Observation` back to `continueRegularOutput`), Mutation 2 (`Store Error Context` rewired → `Fallback Already Used?`), Mutation 3 (store error output rewired → `More Priority URLs?`): each fails exactly the new test "terminates store-error lanes at branch completion without re-arming fallback". All reverted; workflow JSON blob hash equals `HEAD` (`9ced30b`-prefixed blob) — byte-identical. |

Implementer's side observation (a 200 response with a status-less body could still loop): weighed and **not** an AC violation. The app is the only intended caller and every 200/201 from `src/app/api/ingestion/observations/route.ts:18-24` spreads `appendAcceptedObservation`'s result, which always carries `status` (`src/server/observations.ts:64,82`). A status-less 200 requires a non-app server answering (misconfigured `APP_BASE_URL`/proxy) — recorded as a robustness note only.

## Executed experiments (repeatable)

Setup: `docker compose up -d`; login `POST /rest/login` (`{"emailOrLdapLoginId":"validator@local.test","password":"Validate-123"}`, owner created in round 1); create via `POST /rest/workflows`; activate via `POST /rest/workflows/:id/activate` with `{"versionId":…}`; trigger via `GET /webhook/wo0010v-replica?<scenario query>`; read per-node run counts/outputs from `GET /rest/executions/:id` (flatted-pointer `data.data`, resolved recursively). All experiment workflows (7 validator workflows plus 3 stale round-2 leftovers: `passthrough-experiment`, `failmode-experiment`, `failmode-onerror-experiment`) were deactivated, archived, and deleted afterwards; the instance holds zero workflows.

**Validator replica** (`VAL-WO-0010-R4 validator replica`, webhook `wo0010v-replica`) — higher fidelity than round 3's: generated from `n8n/workflows/digital-ethiopia-ingestion.json` at `b8adf90` keeping all 12 IF nodes, all real Code nodes (incl. `Store Error Context`), and `Fetch Priority URL` byte-for-byte verbatim (asserted programmatically before each run), and keeping **`Store Raw Document`/`Store Observation` as real httpRequest nodes** (verbatim typeVersion 4.2, `retryOnFail`/`maxTries: 5`/`waitBetweenTries: 2000`, `onError: continueErrorOutput`) pointed at controllable helper webhooks — "error" variants POST to an *unregistered* webhook path, so n8n answers a genuine HTTP 404, the node retries 5x and emits its real error output, exactly the production failure mode. Cron swapped for a webhook; remaining external HTTP nodes stubbed with Code replicating the exact app echo contracts (`src/server/raw-documents.ts`, `src/app/api/ingestion/observations/route.ts` — routing context without `kpi`) and expression dependencies; the `Complete Pipeline Run` stub evaluates the real node's runId/branchKey expression and throws if either is missing. Three documented deviations on the store nodes, all forced by the new drift findings below and none affecting routing semantics: helper URL (necessarily), Authorization header removed (Drift item 3), `Store Raw Document` jsonBody rewritten to the working `={{ ({…}) }}` form with the identical field set (Drift item 4; `Store Observation`'s `={{$json}}` is already the working form and stayed verbatim). Helpers: `wo0010v-page` (serves `{"body":"<html>…"}`), `wo0010v-raw-stored`, `wo0010v-obs-inserted`, `wo0010v-obs-rejected` (contract echoes); scenario knobs via query (`started`, `urls`, `store`, `obs`; `obs=rejected-then-error` and `store=fallback-error` switch on the posted `sourceType`, so the *fallback-lane* store call errors after a priority-lane rejection).

Scenario outcomes (all executions ended `success`; builder/runner/cleanup scripts embedded in session scratchpad `r4val/` — build.js, build-probe.js, run.js, cleanup.js — reproduce everything from this description):

- **V0** `started=false`: branch stops at `Run Started?`; `Expand KPI Batch` never ran.
- **V1** `obs=inserted` (AC2): full priority lineage; complete once; zero fallback/error-lane nodes.
- **V2** `obs=rejected` (AC3): fallback exactly once; guard closed the branch; complete once.
- **V3** `urls=2&obs=rejected`: p0 → increment → p1 → fallback once; complete once.
- **V4** `obs=error` (round-3 S8 scenario): observation store 404s → error output → `Store Error Context` → complete, each exactly once; zero fallback gates/nodes; no loop (contrast: round 3 observed 70 iterations).
- **V5** `urls=0&obs=error`: direct-fallback lane; fallback pipeline ran once, store errored, error lane once, complete once.
- **V6** `obs=rejected-then-error`: priority rejection arms fallback (once); fallback store errors; error lane once; complete once; `Mark Fallback Used` = 1, query gen = 1 — no re-arm.
- **V7** `store=error`: raw-document store errors on priority lane; `New Document?` 0 runs; error lane → complete once; no downstream AI/store nodes.
- **V8** `store=fallback-error&obs=rejected`: priority doc stored, observation rejected, fallback armed once, fallback raw-doc store errors; error lane once, complete once.
- **Probe J** (`wo0010v-probe-jsonbody`): verbatim `Store Raw Document` parameters against an echo webhook. Run 1 (verbatim headers): node errors `"access to env vars denied"` before any HTTP — basis for Drift item 3. Run 2 (headers stripped): node errors `"The value in the \"JSON Body\" field is not valid JSON"` — the `={"k": $json.v}` no-template form never evaluates — basis for Drift item 4.

## Drift observed

Reported, not fixed, per core rule 5. Items 1–2 carried from round 3; items 3–4 are new findings, **both pre-existing on `main` byte-identical** (WO-0010's diff touches none of these parameters):

1. **`Fetch Priority URL` never yields `$json.body` (round 3, Probe P/S9)** — typeVersion-1 `responseFormat` parameter ignored by HTTP 4.2; real fetched HTML lands in `$json.data`, so extraction always yields `no-readable-text`. Pre-existing since WO-0006. Awaiting user decision on a fix WO.
2. **Multi-KPI batch collapses to the first KPI (round 3, Probe M)** — single-item Code nodes in default "Run Once for All Items" mode. Pre-existing. Awaiting user decision.
3. **NEW: n8n 2.33.0 denies `$env` access in expressions by default (executed: Probe J run 1).** `N8N_BLOCK_ENV_ACCESS_IN_NODE` is unset in `docker-compose.yml`, yet `{{$env.INGESTION_API_KEY}}` evaluation fails with "access to env vars denied" — 2.x flipped the default. Every app/AI HTTP node (all 9 body-bearing nodes) uses `$env` in its URL and/or auth header, including `Start Pipeline Run`, whose error output is unconnected — **so in the real deployment the pipeline dies silently at its first node every cron tick.** Deployment-config-level fix (env flag or n8n credentials), pre-existing, outside WO-0010's routing scope.
4. **NEW: the `={"k": $json.v, …}` jsonBody form never evaluates (executed: Probe J run 2).** n8n only evaluates `{{ }}` segments; the literal remainder is not valid JSON and the node errors on every call. Affects 7 of 9 body-bearing nodes: `Store Raw Document`, `Complete Pipeline Run`, `OpenAI Relevance Gate`, `OpenAI Structured Extraction`, `OpenAI Query Generation`, `Tavily Search via App Provider`, `Filter Search URLs` (`Store Observation` `={{$json}}` and `Start Pipeline Run`'s literal body are fine). Pre-existing on `main`. Interaction with this WO: once item 3 is fixed, a real `Store Raw Document` call would error on this and take the new error lane → clean single completion (V7 shape) — terminating cleanly instead of looping, but ingesting nothing. Items 1–4 together mean **real-runtime ingestion remains inert end-to-end**; recommend one consolidated "n8n runtime enablement" fix WO covering all four plus export-test guards, superseding the per-item decisions pending from round 3.
5. **D-0021 conditional stands: re-confirmed at `b8adf90`** (V0 lock gate; V1–V3 branching). No rollback flags from the IF question. Items 1–4 continue to undermine WO-0006's (and the workflow side of WO-0009's) *runtime* objectives on independent, pre-existing grounds — that question remains with the user.
6. Bookkeeping note: `BRD-0002` sits in `ARCHIVE.md` with `status: validated` (pre-rework MVP pass) while rework WOs against it (WO-0010, WO-0011) run under D-0017. Not altered here; WO-0011 (R4) is still open, so there is no BRD status to advance. User may want the BRD status revisited for consistency.
7. No recorded decision contradicted (checked `../DECISIONS.md`, D-0001–D-0021).

## Duplication

None new in round 4: the fix edits UNIT-0039 (workflow JSON) and its export tests in place. `Store Error Context` adds a **fourth** inline copy of the `contextFrom()` helper (after `Expand Priority URLs`, `Mark Fallback Used`, `Validate Query JSON`) — unavoidable for n8n inline code; noted for WO-0013's unification pass.

## Failures

None. Round-3's Failure 1 is resolved by `b8adf90` (V4–V8, mutation-checked export test).

## Prior rounds

Round 1 (HTTP hops drop workflow context), round 2 (legacy IF shapes never evaluate; throwing `Extract Readable Text` back-references), and round 3 (store-error items defeat the once-per-KPI fallback guard — unbounded loop) are all **resolved** by `54c4c49`, `0cd3bb1`, and `b8adf90` respectively — re-verified here by V0–V8 and the mutation checks. Round-2/round-3 experiment definitions remain valid reproduction recipes in git history (`4d0ff62`, `6837c25`).

WO-0010 is set to `validated`. Per project convention the branch merge is held for user review (workflow touches core pipeline business rules), and Drift items 3–4 need user decisions regardless.
