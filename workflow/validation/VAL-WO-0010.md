---
id: VAL-WO-0010
work-order: WO-0010
date: 2026-08-06
result: fail
---

# Validation: WO-0010

Round 2, validating the rework at `54c4c49` (`fix: preserve n8n workflow context`). Fresh session, separate from the implementer. Static suite on `wo-0010-fallback-search-reachability-fix`: `npm run lint`, `npm test` (20 files / 76 tests), `npm run build` — all pass. No OpenAI/Tavily keys in this environment (same constraint as rounds before), so the runtime mechanisms were again tested with controlled experiments against the pinned n8n (`n8nio/n8n:2.33.0` from `docker-compose.yml`, HTTP Request typeVersion 4.2, IF typeVersion 2, `executionOrder: v1` — all identical to the ingestion workflow; deployment is a straight JSON import per `docs/operations.md`, so stored parameters run verbatim).

**Round 1's failure is fixed in mechanism but the WO still fails.** The back-reference rehydration the rework introduced does work — `$('Node').item.json` recovers full context through successful HTTP hops *and* through `onError: continueRegularOutput` error items (Experiments A1–A2). But three new executed findings block the acceptance criterion, the first of which is decisive: **IF nodes in this workflow never evaluate their conditions.**

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| BRD-0002.R1.AC1 (priority URLs checked before fallback) | pass (structural + executed export tests) | `Has Priority URLs?` → `Expand Priority URLs` ordering asserted in `src/lib/n8n/workflow-export.test.ts` (executed in `npm test`). Runtime caveat: branching is inert (Failure 1), so priority-first holds only degenerately — every KPI takes the priority path. |
| BRD-0002.R1.AC2 (valid observation → no fallback same run) | blocked | Vacuously true at runtime — the fallback path is dead code (Failure 1: the IF false-outputs that feed `More Priority URLs?` / `Fallback Already Used?` / `Mark Fallback Used` never emit). The guard cannot be exercised; and if IFs were fixed, Failure 2 corrupts `fallbackUsed` on the fallback fetch path. |
| BRD-0002.R1.AC3 (no valid observation → continue to fallback) | **fail** | Experiment E (executed): an item with `status: "rejected"` at an exact replica of `Observation Accepted?` (legacy `string`/`equal` conditions, typeVersion 2) routes to the **true** output → `Complete Pipeline Run`. The rejected observation still never reaches fallback — same terminal outcome as round 1, new mechanism. |

## Executed experiments (repeatable)

Setup: `docker compose up -d`; login `POST /rest/login` (`{"emailOrLdapLoginId":"validator@local.test","password":"Validate-123"}`, owner created in round 1); create via `POST /rest/workflows` (body = workflow JSON); activate via `POST /rest/workflows/:id/activate` with body `{"versionId":"<versionId from GET /rest/workflows/:id>"}`; trigger via `GET http://localhost:5678/webhook/<path>`; read per-branch node outputs from `GET /rest/executions/:id` (the `data.data` string is n8n's flattened-pointer format — resolve numeric-string references recursively). Experiment workflows were deleted after the run (archive then delete); rebuild them from the definitions below.

All experiment workflows: webhook trigger (`responseMode: "lastNode"`), `settings: {"executionOrder": "v1"}`, Code nodes typeVersion 2, HTTP Request typeVersion 4.2 with `onError: "continueRegularOutput"` where noted.

**A — back-references vs HTTP hops** (chain: Webhook → ExpandPriority → FetchP(HTTP) → ExtractP → HTTPErr → AfterErr → ExpandFallback → FetchF(HTTP) → ExtractF). ExpandPriority emits `{runId, branchKey, kpi:{id,name}, sourceType:'priority', fallbackUsed:false, candidateUrls, priorityIndex:0, url:'…?u=priority'}`; HTTPErr forces an error item via `jsonBody: ={"broken": $json.missing.field}` with `onError: continueRegularOutput`; ExpandFallback re-emits context with `url:'…?u=fallback', sourceType:'fallback', fallbackUsed:true`; ExtractP/AfterErr/ExtractF each `try { $('ExpandPriority').item.json }`, ExtractF also reads `$('ExpandFallback').item.json`.

1. **A1 (success hop)**: ExtractP recovered full context (`url`, `sourceType`, `fallbackUsed`, `kpi.name`, `runId`) after FetchP replaced the item with `{"status":"ok"}`. Back-reference works through a successful HTTP hop.
2. **A2 (error item)**: AfterErr recovered full context on the error item `{"error":"The value in the \"JSON Body\" field is not valid JSON"}`. Back-reference works through `onError: continueRegularOutput` error items — round 1's Failure 1 is resolved in mechanism.
3. **A3 (stale context — Failure 2)**: ExtractF, running after the *fallback* fetch, got `$('ExpandPriority').item.json` = `{url:'…?u=priority', sourceType:'priority', fallbackUsed:false}` — the stale priority item — while `$('ExpandFallback').item.json` held the correct fallback context. `Extract Readable Text` uses exactly this stale reference.

**D — IF v2 proper format + cross-lineage resolution** (Webhook → StartItems (emits `{who:'A',hasPriority:true}`, `{who:'B',hasPriority:false}`) → SplitProper (IF typeVersion 2, **proper v2 filter format**: `conditions: {options:{caseSensitive:true,leftValue:"",typeValidation:"strict",version:2}, conditions:[{id:"c1", leftValue:"={{ $json.hasPriority }}", operator:{type:"boolean",operation:"true",singleValue:true}}], combinator:"and"}`) → true: Touch(Code) → JoinResolve; false: → JoinResolve (`runOnceForEachItem`, `try { $('Touch').item.json } catch`)).

- SplitProper routed correctly: out[0]=A, out[1]=B — **the IF node works on 2.33.0 when given the v2 parameter format** (control for Failure 1).
- Item B (lineage without Touch): `$('Touch').item` **threw** (`Cannot read properties of undefined…`) — no cross-item contamination, but any *uncaught* back-reference to a node outside the item's lineage kills the branch (Failure 3).

**B/C — legacy conditions misroute** (same shapes as B/D but with IF typeVersion 2 + legacy `conditions: {boolean:[{value1:"={{$json.hasPriority}}", value2:true}]}`; C used a literal `={{false}}` condition). Both routed **every item to out[0] (true)**, including `hasPriority:false` and literal false — per-branch execution dumps confirm out[1] empty.

**E — `Observation Accepted?` replica (decisive for AC3)**:

```json
{ "parameters": { "conditions": { "string": [ { "value1": "={{$json.status}}", "operation": "equal", "value2": "inserted" } ] } },
  "name": "ObservationAcceptedReplica", "type": "n8n-nodes-base.if", "typeVersion": 2 }
```

Fed `{status:'rejected'}`; true-output → Code `routedTo: 'TRUE-branch (Complete Pipeline Run)'`, false-output → `routedTo: 'FALSE-branch (More Priority URLs?)'`. Webhook response: `{"routedTo":"TRUE-branch (Complete Pipeline Run)","status":"rejected"}`.

## Failures

1. **IF nodes never evaluate legacy-format conditions — AC3 unreachable (executed: B, C, E; control: D).** All 12 IF nodes in `n8n/workflows/digital-ethiopia-ingestion.json` declare `typeVersion: 2` with typeVersion-1 parameter shapes (`conditions: {boolean:[…]}` / `{string:[…]}`). On n8n 2.33.0 this routes **every item to the true output** unconditionally. Consequence for this WO: `Observation Accepted?` sends rejected observations to `Complete Pipeline Run` — the fallback path (`More Priority URLs?` → `Fallback Already Used?` → `Mark Fallback Used` → query generation) is dead code, since every node feeding it hangs off an IF false-output that never emits. Fix: migrate every IF node to the v2 filter format (Experiment D's parameter shape, proven correct on this n8n) — or pin `typeVersion: 1` — and extend the export tests to assert the condition format matches the declared typeVersion so this class of defect is caught statically.
2. **Stale context on the fallback fetch path (executed: A3).** `Extract Readable Text` rehydrates from `$('Expand Priority URLs').item.json`, but it also serves the fallback route (`Expand Filtered URLs` → `Has URL?` → `Fetch Priority URL` → `Extract Readable Text`). For a fallback item whose lineage passed through the priority loop, the back-reference returns the *old priority item*: the stored document gets the priority `url` as `sourceUrl`, `sourceType: 'priority'`, and `fallbackUsed: false` — corrupting dedup, provenance, and the once-per-KPI guard. Fix: reference a node valid on both paths (after Failure 1 is fixed, `$('Has URL?').item.json` — an IF passes items through unchanged — or split extraction per path).
3. **No-priority-URLs branch dies at `Extract Readable Text` (executed: D).** For a KPI entering fallback directly (`Has Priority URLs?` false), `Expand Priority URLs` is not in the item's lineage; the uncaught `$('Expand Priority URLs')` throws and kills the branch (Code node has no error handling). Masked today by Failure 1; will surface the moment IFs are fixed. Same fix as Failure 2. (`Validate Query JSON`'s `contextFrom()` try/catch is the correct defensive pattern — D also shows a non-lineage reference throws rather than silently resolving to another KPI's item, so no cross-branch contamination risk.)

## Drift observed

- **Failure 1 is pre-existing on `main`** for 11 of the 12 IF nodes (WO-0010 added `Observation Accepted?` in the same broken format). This refutes runtime assumptions earlier validations rested on — flagging per instructions, not silently fixing:
  - **WO-0009 (validated)**: `Run Started?` always routes true, so a `started: false` response (lock already held) still proceeds to `Expand KPI Batch` — the lock's mutual exclusion is defeated at runtime. VAL-WO-0009's executed evidence was app-API-level and export-test-level, so its cited evidence stands, but its objective is undermined; recommend rollback review.
  - **WO-0006 (archived, validated)**: the workflow's entire branching behavior (dedup skip, relevance gating, priority iteration) is inert at runtime; every fetched document marches straight through relevance → extraction → store → complete. Recommend rollback review.
  - No prior validation ever executed an IF node on the pinned n8n — the round-1 experiments used Code/HTTP nodes only. This gap is why the defect survived.
- No recorded decision contradicted (checked all of `../DECISIONS.md`, D-0001–D-0020).
- Echo contracts verified correct by inspection: `src/server/raw-documents.ts` spreads `workflowContext` at top level with serialized `rawDocument`; `src/app/api/ingestion/observations/route.ts` echoes routing context with 200 + `status: "rejected"`.

## Duplication

None new: the rework edits UNIT-0039 (workflow JSON) and its export tests in place; no new units, helpers, or endpoints.

WO-0010 set back to `in-progress`. Fix is a fresh session's job; this report plus the experiment definitions above suffice to reproduce every finding.
