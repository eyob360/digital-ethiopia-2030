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
- Operator: authenticated user who can manage KPI definitions and operational controls.
- Viewer: authenticated user who can view dashboard data but cannot change configuration.

## Requirements

### BRD-0003.R1: Dashboard data API
As a dashboard frontend, I want an API for processed KPI data so that visualization logic can remain separate from ingestion logic.

**Acceptance criteria:**
- AC1: When the dashboard requests KPI data, the backend shall expose latest observations for configured KPIs.
- AC2: When the dashboard requests a KPI history, the backend shall expose time-series observations for that KPI.
- AC3: When API data is returned, the backend shall include source URL, observed date, created date, AI confidence, and review flag where available.
- AC4: When API data is returned, the frontend shall not be responsible for heavy business logic such as confidence thresholding, normalization, or latest-observation selection.

### BRD-0003.R2: Authentication and roles
As a technical operator, I want dashboard access controlled by role so that operational controls are protected while read-only users can still monitor progress.

**Acceptance criteria:**
- AC1: When a user accesses the MVP, the system shall require login before showing dashboard or admin data.
- AC2: When an `operator` is authenticated, the system shall allow KPI administration and operational controls.
- AC3: When a `viewer` is authenticated, the system shall allow read-only dashboard access.
- AC4: When a `viewer` attempts KPI administration or operational control actions, the system shall deny the action.
- AC5: When an unauthenticated request is made to protected dashboard or admin APIs, the system shall deny the request.

### BRD-0003.R3: Latest KPI view
As a decision maker, I want to see the latest value for each KPI so that I can quickly assess current Digital Ethiopia 2030 progress.

**Acceptance criteria:**
- AC1: When the dashboard loads, it shall display configured KPIs grouped or filterable by category.
- AC2: When a KPI has at least one observation, the dashboard shall display its latest value, unit, region, observed date, and confidence/review status.
- AC3: When a KPI has no observations, the dashboard shall display an empty state for that KPI.

### BRD-0003.R4: Historical KPI view
As a program analyst, I want to inspect observation history so that I can evaluate KPI trends and changes over time.

**Acceptance criteria:**
- AC1: When a user opens a KPI detail view, the dashboard shall show historical observations for that KPI.
- AC2: When historical observations are shown, the dashboard shall preserve source traceability for each observation.
- AC3: When historical observations contain review-flagged values, the dashboard shall visibly distinguish them from auto-accepted values.
- AC4: When historical observations contain review-flagged values, the MVP shall not provide approve or reject actions.

### BRD-0003.R5: Target progress
As a decision maker, I want to compare current KPI values with Digital Ethiopia 2030 targets so that progress is visible.

**Acceptance criteria:**
- AC1: When a KPI has a `target_value` and latest observation, the dashboard shall show progress from current value to target.
- AC2: When a KPI lacks a `target_value`, the dashboard shall omit target progress for that KPI without treating it as an error.
- AC3: When target progress is shown, the system shall use the same unit for target and observation values.

### BRD-0003.R6: MVP page set
As a user, I want a focused set of dashboard and operations pages so that the MVP supports monitoring and configuration without unnecessary screens.

**Acceptance criteria:**
- AC1: When an authenticated user opens the app, the system shall provide a dashboard overview page.
- AC2: When an authenticated user selects a KPI, the system shall provide a KPI detail page.
- AC3: When an authenticated `operator` manages KPI definitions, the system shall provide a KPI admin page.
- AC4: When an authenticated `operator` monitors ingestion operations, the system shall provide a pipeline status/runs page.
- AC5: When a user authenticates or manages basic session/account state, the system shall provide login/account basics.
- AC6: When a `viewer` navigates the app, the system shall hide or deny operator-only pages and actions.

## Non-functional requirements

### BRD-0003.N1: Separation of concerns
- AC1: When dashboard pages render KPI data, heavy ingestion and transformation logic shall remain in the backend or pipeline layer.

## Out of scope
- Editing, approving, or rejecting review-flagged observations from the dashboard in the MVP.
- Chatbot, vector search, and advanced analytics.
- Multi-language processing.

## Open questions
None.
