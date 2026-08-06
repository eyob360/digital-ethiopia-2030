---
id: WO-0010
title: Fallback search reachability for rejected observations
implements: [BRD-0002.R1]
blueprint: BP-0001
depends-on: [WO-0009]
units-touched: [UNIT-0038, UNIT-0039]
status: in-progress
---

# WO-0010: Fallback search reachability for rejected observations

## Summary
A priority-source URL that yields a *rejected* observation candidate terminates its KPI branch instead of falling back to web search. `POST /api/ingestion/observations` returns 422 on rejection, and the n8n store node's `onError: continueRegularOutput` routes that error output to `Complete Pipeline Run` — the branch never reaches `Mark Fallback Used`. Result: BRD-0002.R1.AC3 is unreachable for the rejected-candidate case, and (pre-WO-0009) the branch's arrival at the completion node also released the pipeline lock early. Fix the contract or wiring so a rejected observation from a priority URL continues to the fallback path.

## In scope
- Make rejection a routable outcome: either the observations endpoint returns 200 with an explicit `status: rejected` payload the workflow can branch on, or the error output is wired to the fallback path — one approach, chosen to keep the API contract coherent for other callers.
- Ensure fallback still runs at most once per KPI (`fallbackUsed` guard preserved).
- Update the workflow export test to assert the rejected-candidate path reaches fallback.

## Out of scope
- Lock/budget release semantics (WO-0009 — this WO builds on its completion wiring).
- Validator unification between `external-contracts.ts` and n8n inline code (WO-0013).

## Requirements

### BRD-0002.R1: Priority source retrieval
- AC1: When a KPI has `source_urls`, the pipeline shall check those URLs before generating fallback web search queries.
- AC2: When priority URLs yield a valid observation, the pipeline shall not use fallback web search for that KPI in the same run.
- AC3: When priority URLs do not yield a valid observation, the pipeline shall continue to fallback AI-generated search. **(Currently violated for the rejected-candidate case: 422 + `onError: continueRegularOutput` routes to `Complete Pipeline Run`, skipping `Mark Fallback Used`.)**

## Implementation notes
- Touch points: `src/app/api/ingestion/observations` (UNIT-0038), n8n workflow (UNIT-0039), observation service (UNIT-0018).
- "Valid observation" per BRD-0002 means one that passes normalization and the confidence gate — a low-confidence rejection is precisely the "did not yield a valid observation" case AC3 exists for.
- Coordinate with WO-0009's completion changes — both edit the workflow JSON; do not run these WOs in parallel sessions.

## Testing plan
- `npm run lint`, `npm test`, `npm run build` (testing policy in `../brds/OVERVIEW.md`).
- Workflow export assertions: rejected-candidate output routes to the fallback path, not completion; fallback still capped at once per KPI.
- Live check (validation): seed a KPI with a priority URL engineered to produce a rejected candidate; observe the run proceed to fallback search and terminate cleanly.
