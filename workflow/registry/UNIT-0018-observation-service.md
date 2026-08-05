---
id: UNIT-0018
name: Observation service
kind: service
path: src/server/observations.ts
status: active
---

# UNIT-0018: Observation service

**Purpose:** Validates, confidence-gates, and appends accepted KPI observations.

**Interface:** `parseObservationInput`, `appendAcceptedObservation`, and `serializeObservation`.

**Variants/options:** Rejected candidates return `status: "rejected"` without writing a row.
