---
id: UNIT-0032
name: Pipeline controls
kind: component
path: src/components/pipeline/pipeline-controls.tsx
status: active
---

# UNIT-0032: Pipeline controls

**Purpose:** Client-side pipeline lock status and action controls for operator workflows.

**Interface:** `PipelineControls({ initialLock, initialEligibleKpis })`.

**Variants/options:** Starts runs, completes runs, and releases locks through existing pipeline APIs.
