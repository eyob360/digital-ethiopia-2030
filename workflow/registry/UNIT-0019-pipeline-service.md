---
id: UNIT-0019
name: Pipeline service
kind: service
path: src/server/pipeline.ts
status: active
---

# UNIT-0019: Pipeline service

**Purpose:** Server boundary for ingestion lock status/transitions, eligible KPI batch loading, and per-run document budget reservations.

**Interface:** `getPipelineLockStatus`, `acquirePipelineLock`, `completePipelineRunBranch`, `releasePipelineLock`, `reservePipelineDocumentSlot`, and `startPipelineRun`.

**Variants/options:** Lock acquisition is atomic through `updateMany` on unlocked or stale rows; started runs carry a `runId` and KPI branch counts; branch completion is idempotent by branch key and releases the lock only after every branch is terminal. Document budget reservation is atomic through `updateMany` on locked rows under the per-run limit; `startPipelineRun` does not load KPIs when the lock is already held and releases the lock immediately when an acquired run has no eligible KPI batch.
