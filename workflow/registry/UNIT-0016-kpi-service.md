---
id: UNIT-0016
name: KPI service
kind: service
path: src/server/kpis.ts
status: active
---

# UNIT-0016: KPI service

**Purpose:** Server-side KPI definition CRUD and pipeline batch loading.

**Interface:** `listKpiDefinitions`, `getKpiDefinition`, `createKpiDefinition`, `updateKpiDefinition`, `deleteKpiDefinition`, `loadEligibleKpisForPipeline`, `findKpisWithLatestObservation`.

**Variants/options:** Pipeline loading applies fetch eligibility and returns at most 10 KPIs by default. `findKpisWithLatestObservation` is the shared KPI-plus-latest-observation query also used by the dashboard service (UNIT-0017; WO-0013 dedup).
