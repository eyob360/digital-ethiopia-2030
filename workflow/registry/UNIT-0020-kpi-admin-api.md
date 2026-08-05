---
id: UNIT-0020
name: KPI admin API
kind: endpoint
path: src/app/api/kpis
status: active
---

# UNIT-0020: KPI admin API

**Purpose:** Operator-only API for KPI definition listing, creation, viewing, editing, deletion, and observation append/history.

**Interface:** `/api/kpis`, `/api/kpis/[id]`, and `/api/kpis/[id]/observations`.

**Variants/options:** Observation history `GET` accepts viewer access; KPI catalogue mutations require operator access.
