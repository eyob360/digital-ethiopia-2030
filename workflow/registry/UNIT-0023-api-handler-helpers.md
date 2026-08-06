---
id: UNIT-0023
name: API handler helpers
kind: service
path: src/server/api/handlers.ts
status: active
---

# UNIT-0023: API handler helpers

**Purpose:** Shared helpers for repeated API handler patterns: role-protected list responses and the pipeline run start/complete action handler.

**Interface:** `jsonListWithRole(requirement, key, loadItems)` and `handlePipelineRunAction(body)`.

**Variants/options:** Uses the same uppercase `UserRole` requirement vocabulary as UNIT-0015. `handlePipelineRunAction` is the single implementation behind `/api/pipeline/runs` (session auth) and `/api/ingestion/pipeline/runs` (API-key auth); the routes only authenticate (WO-0013 dedup).
