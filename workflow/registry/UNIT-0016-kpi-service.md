---
id: UNIT-0016
name: KPI service
kind: service
path: src/server/kpis.ts
status: active
---

# UNIT-0016: KPI service

**Purpose:** Server-side KPI definition CRUD and pipeline batch loading.

**Interface:** `listKpiDefinitions`, `getKpiDefinition`, `createKpiDefinition`, `updateKpiDefinition`, `deleteKpiDefinition`, `loadEligibleKpisForPipeline`.

**Variants/options:** Pipeline loading applies fetch eligibility and returns at most 10 KPIs by default.
