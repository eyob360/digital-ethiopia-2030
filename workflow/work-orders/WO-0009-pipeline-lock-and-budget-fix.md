---
id: WO-0009
title: Pipeline lock lifecycle and document budget fix
implements: [BRD-0001.R6, BRD-0002.N2]
blueprint: BP-0001
depends-on: none
units-touched: []
status: ready
---

# WO-0009: Pipeline lock lifecycle and document budget fix

## Summary
The pipeline's concurrency lock and document budget are broken in three related ways. (1) Premature release: `releasePipelineLock` (`src/server/pipeline.ts:39`) resets `documentsProcessed` to 0 and is reachable from four terminal branches of the n8n workflow, while `Expand KPI Batch` fans out ~10 parallel KPI branches — the first branch to finish releases the lock and zeroes the budget for all still-running branches. (2) Dead guard: the n8n `Apply Document Budget` node reads `item.json.documentsProcessed`, a field `Expand KPI Batch` never emits, so the guard always sees 10 remaining and never curtails fetches. (3) No crash recovery: `lockedAt` is written (`pipeline.ts:26`) but never read — an n8n crash mid-run leaves the lock held forever with no expiry or recovery path. Fix all three so the lock releases exactly once, after every branch is terminal, and the budget guard consults a real counter.

**Sensitive area:** data integrity of the pipeline lock/budget — per conventions this WO waits for user review before merge, even after validation passes.

## In scope
- Completion semantics: the lock is released (and the counter reset) only when the whole run is finished — e.g. an n8n merge/wait barrier before `Complete Pipeline Run`, or app-side run accounting that tracks outstanding branches; releasing from a lone terminal branch must no longer end the run.
- The n8n `Apply Document Budget` guard: either read the authoritative server-side counter (`reservePipelineDocumentSlot` / pipeline status API) or remove the node in favor of the existing app-side enforcement — no guard that reads a field nothing emits.
- Stale-lock recovery using `lockedAt` (e.g. treat a lock older than a configured expiry as stale on acquire). No AC mandates a specific mechanism — propose one; the user-review gate on this WO covers the design.
- Update the workflow export test and pipeline service tests to assert the new semantics.

## Out of scope
- Fallback-search reachability (WO-0010).
- URL filtering (WO-0011).
- Budget-before-dedup ordering and validator unification (WO-0013).

## Requirements

### BRD-0001.R6: Pipeline concurrency control
- AC1: When the scheduled workflow starts, the system shall check a database pipeline lock before processing.
- AC2: When the pipeline lock is true, the system shall stop the run before loading KPI definitions.
- AC3: When the pipeline lock is false, the system shall set the lock to true before continuing.
- AC4: When the pipeline run completes, the system shall set the lock to false. **(Currently violated: the lock is released when the *first branch* completes, not the run.)**

### BRD-0002.N2: MVP cost controls
- AC1: When the pipeline runs, the system shall process no more than 10 documents per hour. **(Currently violated in effect: the first-finisher release zeroes `documentsProcessed` mid-run, re-opening the budget; the n8n-side guard is dead code.)**
- AC2: When the pipeline runs, the system shall process no more than 5 URLs per KPI.
- AC3: When the MVP is implemented, the system shall not require a vector database, distributed processing, data warehouse, paid data APIs other than the LLM and configured fallback search-provider APIs (D-0007, D-0020), complex ML models, real-time streaming, multi-language processing, or advanced entity resolution.

## Implementation notes
- Evidence trail: VAL-WO-0006 "Drift observed" notes 1 and 2 flagged exactly these gaps (first-terminal release; crash leaves lock held); D-0017 records the rework decision.
- The DB counter (`PipelineLock.documentsProcessed`, migration `0002_pipeline_document_counter`) is authoritative and fail-closed — keep it so; this WO fixes the *release timing* and the dead n8n guard, not the counter mechanism.
- AC1 says "per hour": with correct release timing, per-run enforcement + hourly schedule yields ≤10/hour; keep that framing consistent with VAL-WO-0006.
- Registry: UNIT-0019 (pipeline service), UNIT-0036 (raw document service), UNIT-0039 (n8n ingestion workflow) are the touch points — extend, don't duplicate.

## Testing plan
- `npm run lint`, `npm test`, `npm run build`, `npx prisma validate` (testing policy in `../brds/OVERVIEW.md`).
- Unit tests: release only on run completion with N outstanding branches; stale-lock acquire path; budget guard consults the real counter (or is gone from the export).
- Live check (validation): start a run against local Docker Postgres + n8n, verify the lock survives an early branch completion, documents 11+ are refused across parallel branches, and a simulated crash (kill n8n mid-run) recovers on the next scheduled start.
