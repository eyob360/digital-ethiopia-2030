---
id: BRD-0003
title: Dashboard API and visualization
source: srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 12: KPI Observation Storage; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 13: Dashboard & API Layer
status: draft
---

# BRD-0003: Dashboard API and visualization

## Overview
This feature exposes processed KPI observations to the web dashboard and presents latest values, historical trends, review status, source traceability, and target progress without placing heavy business logic in the frontend.

## Terminology
- Latest observation: the most recent observation for a KPI by `created_at`.
- Time series: historical observations for a KPI.
- Review flag: marker applied to medium-confidence observations that need analyst attention.
- Target progress: comparison of the latest observation value against the KPI target value.

## Requirements

### BRD-0003.R1: Dashboard data API
As a dashboard frontend, I want an API for processed KPI data so that visualization logic can remain separate from ingestion logic.

**Acceptance criteria:**
- AC1: When the dashboard requests KPI data, the backend shall expose latest observations for configured KPIs.
- AC2: When the dashboard requests a KPI history, the backend shall expose time-series observations for that KPI.
- AC3: When API data is returned, the backend shall include source URL, observed date, created date, AI confidence, and review flag where available.
- AC4: When API data is returned, the frontend shall not be responsible for heavy business logic such as confidence thresholding, normalization, or latest-observation selection.

### BRD-0003.R2: Latest KPI view
As a decision maker, I want to see the latest value for each KPI so that I can quickly assess current Digital Ethiopia 2030 progress.

**Acceptance criteria:**
- AC1: When the dashboard loads, it shall display configured KPIs grouped or filterable by category.
- AC2: When a KPI has at least one observation, the dashboard shall display its latest value, unit, region, observed date, and confidence/review status.
- AC3: When a KPI has no observations, the dashboard shall display an empty state for that KPI.

### BRD-0003.R3: Historical KPI view
As a program analyst, I want to inspect observation history so that I can evaluate KPI trends and changes over time.

**Acceptance criteria:**
- AC1: When a user opens a KPI detail view, the dashboard shall show historical observations for that KPI.
- AC2: When historical observations are shown, the dashboard shall preserve source traceability for each observation.
- AC3: When historical observations contain review-flagged values, the dashboard shall visibly distinguish them from auto-accepted values.

### BRD-0003.R4: Target progress
As a decision maker, I want to compare current KPI values with Digital Ethiopia 2030 targets so that progress is visible.

**Acceptance criteria:**
- AC1: When a KPI has a `target_value` and latest observation, the dashboard shall show progress from current value to target.
- AC2: When a KPI lacks a `target_value`, the dashboard shall omit target progress for that KPI without treating it as an error.
- AC3: When target progress is shown, the system shall use the same unit for target and observation values.

## Non-functional requirements

### BRD-0003.N1: Separation of concerns
- AC1: When dashboard pages render KPI data, heavy ingestion and transformation logic shall remain in the backend or pipeline layer.

## Out of scope
- Editing or approving review-flagged observations from the dashboard in the MVP.
- Chatbot, vector search, and advanced analytics.
- Multi-language processing.

## Open questions
- Which dashboard roles are required for MVP, if any?
- Should the MVP include a login/auth flow?
- Should review-flagged observations only be visible, or should analysts be able to approve/reject them in the first release?
- What visual pages are required beyond overview and KPI detail?
