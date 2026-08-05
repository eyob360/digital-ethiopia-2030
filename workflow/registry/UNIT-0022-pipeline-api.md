---
id: UNIT-0022
name: Pipeline API
kind: endpoint
path: src/app/api/pipeline
status: active
---

# UNIT-0022: Pipeline API

**Purpose:** Operator-only API for pipeline lock state/transitions and eligible KPI batch loading.

**Interface:** `GET /api/pipeline/kpis`, `GET /api/pipeline/lock`, `POST /api/pipeline/lock`, and `POST /api/pipeline/runs`.

**Variants/options:** Lock `POST` supports `{"action":"acquire"}` and `{"action":"release"}`. Run `POST` supports `{"action":"start"}` and `{"action":"complete"}`.
