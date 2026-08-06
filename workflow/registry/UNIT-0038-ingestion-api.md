---
id: UNIT-0038
name: Ingestion API
kind: endpoint
path: src/app/api/ingestion
status: active
---

# UNIT-0038: Ingestion API

**Purpose:** n8n-facing API boundary for eligible KPI loading, pipeline run lock transitions, URL filtering, Tavily search, raw document storage, and observation persistence.

**Interface:** Routes under `/api/ingestion/*`.

**Variants/options:** Protected by `INGESTION_API_KEY` bearer auth instead of browser session auth. `/url-filter` reads the stored operator override lists (UNIT-0041) on every request, so list changes apply without redeploy. `/pipeline/runs` shares its implementation with the operator route via `handlePipelineRunAction` (UNIT-0023); `/search` validates queries and Tavily responses with the UNIT-0040 contracts (WO-0013).
