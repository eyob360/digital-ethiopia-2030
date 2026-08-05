---
id: UNIT-0017
name: Dashboard service
kind: service
path: src/server/dashboard.ts
status: active
---

# UNIT-0017: Dashboard service

**Purpose:** Server-side dashboard response shaping for latest observations, KPI history, and target progress.

**Interface:** `getDashboardKpis`, `getKpiHistory`, and `calculateTargetProgress`.

**Variants/options:** Target progress is omitted when target values are missing, invalid, or unit-mismatched.
