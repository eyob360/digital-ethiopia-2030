---
id: BRD-0001
title: KPI definition and pipeline control
source: srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Fetch interval (per-KPI); srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 1: Scheduler & Pipeline Control; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 2: KPI Definition Loader
status: draft
---

# BRD-0001: KPI definition and pipeline control

## Overview
This feature defines the controlled KPI catalogue and the scheduling rules that determine when a KPI is eligible for ingestion. It prevents uncontrolled scraping, duplicate pipeline runs, and accidental KPI discovery outside the configured Digital Ethiopia 2030 scope.

## Terminology
- KPI definition: a configured metric the system is allowed to monitor.
- Observation: one collected value for a KPI at a specific time, stored as history.
- Priority source URL: a configured URL or website to check before fallback web search.
- Fetch interval: the minimum age of the latest observation before the KPI should be fetched again.
- Pipeline lock: a database flag that prevents concurrent workflow runs.

## Requirements

### BRD-0001.R1: KPI definitions
As a technical operator, I want to manage a controlled list of KPIs so that the system only monitors approved Digital Ethiopia 2030 metrics.

**Acceptance criteria:**
- AC1: When a KPI definition is stored, the system shall support `id`, `name`, `description`, `expected_unit`, `category`, optional `source_urls`, optional `target_value`, and `fetch_interval_hours`.
- AC2: When `fetch_interval_hours` is not provided, the system shall use a default interval of 24 hours.
- AC3: When `source_urls` is empty, the system shall allow the pipeline to use fallback AI-generated web search.
- AC4: When `target_value` is present, the system shall treat it as the dashboard progress target in the same unit as observations.

### BRD-0001.R2: KPI administration UI
As a technical operator, I want an admin UI for KPI definitions so that approved metrics can be maintained without direct database edits.

**Acceptance criteria:**
- AC1: When an authorized operator opens KPI administration, the system shall list existing KPI definitions.
- AC2: When an authorized operator creates a KPI definition, the system shall capture the fields required by BRD-0001.R1.
- AC3: When an authorized operator edits a KPI definition, the system shall persist changes to the controlled KPI catalogue.
- AC4: When an authorized operator views a KPI definition, the system shall show source URLs, target value, expected unit, category, and fetch interval.

### BRD-0001.R3: KPI batch loading
As a technical operator, I want the pipeline to load KPI definitions in bounded batches so that each run remains predictable and low cost.

**Acceptance criteria:**
- AC1: When a pipeline run starts, the system shall load KPI definitions from the database.
- AC2: When loading KPI definitions, the system shall limit each run to no more than 10 KPIs.
- AC3: When no KPI definitions are available, the system shall complete without enqueueing ingestion work.

### BRD-0001.R4: Per-KPI fetch eligibility
As a technical operator, I want each KPI to have its own fetch interval so that high-frequency and low-frequency metrics can be updated differently.

**Acceptance criteria:**
- AC1: When a KPI has no observations, the system shall consider it eligible for ingestion.
- AC2: When a KPI has observations, the system shall compare the latest observation `created_at` with `now - fetch_interval_hours`.
- AC3: When the latest observation is older than `now - fetch_interval_hours`, the system shall consider the KPI eligible for ingestion.
- AC4: When the latest observation is not older than `now - fetch_interval_hours`, the system shall skip ingestion for that KPI.

### BRD-0001.R5: Pipeline concurrency control
As a technical operator, I want only one pipeline execution at a time so that duplicate processing and unstable writes are avoided.

**Acceptance criteria:**
- AC1: When the scheduled workflow starts, the system shall check a database pipeline lock before processing.
- AC2: When the pipeline lock is true, the system shall stop the run before loading KPI definitions.
- AC3: When the pipeline lock is false, the system shall set the lock to true before continuing.
- AC4: When the pipeline run completes, the system shall set the lock to false.

## Non-functional requirements

### BRD-0001.N1: Operational simplicity
- AC1: When running the MVP pipeline, the system shall avoid distributed processing, vector databases, data warehouses, and paid data APIs other than the LLM API.

## Out of scope
- Automatic creation of new KPI definitions from web content.
- Historical backfilling.
- Real-time streaming.

## Open questions
- What are the initial Digital Ethiopia 2030 KPIs and target values?
