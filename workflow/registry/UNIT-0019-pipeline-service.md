---
id: UNIT-0019
name: Pipeline service
kind: service
path: src/server/pipeline.ts
status: active
---

# UNIT-0019: Pipeline service

**Purpose:** Server boundary for ingestion lock status/transitions and eligible KPI batch loading.

**Interface:** `getPipelineLockStatus`, `acquirePipelineLock`, `releasePipelineLock`, and `startPipelineRun`.

**Variants/options:** Lock acquisition is atomic through `updateMany` on unlocked rows; `startPipelineRun` does not load KPIs when the lock is already held and releases the lock immediately when an acquired run has no eligible KPI batch.
