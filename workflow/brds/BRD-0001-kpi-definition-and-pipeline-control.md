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

### BRD-0001.R3: Initial KPI catalogue
As a program analyst, I want the MVP seeded with an initial Digital Ethiopia 2030 KPI catalogue so that the dashboard has a controlled starting scope.

**Acceptance criteria:**
- AC1: When the MVP is initialized, the system shall include the initial KPI catalogue listed in this BRD.
- AC2: When a starter KPI has no confirmed numeric target, the system shall allow `target_value` to remain empty.
- AC3: When a starter KPI has preferred source URLs, the system shall store those URLs in `source_urls`.
- AC4: When a starter KPI has no custom fetch interval, the system shall use the default interval from BRD-0001.R1.

### BRD-0001.R4: KPI batch loading
As a technical operator, I want the pipeline to load KPI definitions in bounded batches so that each run remains predictable and low cost.

**Acceptance criteria:**
- AC1: When a pipeline run starts, the system shall load KPI definitions from the database.
- AC2: When loading KPI definitions, the system shall limit each run to no more than 10 KPIs.
- AC3: When no KPI definitions are available, the system shall complete without enqueueing ingestion work.

### BRD-0001.R5: Per-KPI fetch eligibility
As a technical operator, I want each KPI to have its own fetch interval so that high-frequency and low-frequency metrics can be updated differently.

**Acceptance criteria:**
- AC1: When a KPI has no observations, the system shall consider it eligible for ingestion.
- AC2: When a KPI has observations, the system shall compare the latest observation `created_at` with `now - fetch_interval_hours`.
- AC3: When the latest observation is older than `now - fetch_interval_hours`, the system shall consider the KPI eligible for ingestion.
- AC4: When the latest observation is not older than `now - fetch_interval_hours`, the system shall skip ingestion for that KPI.

### BRD-0001.R6: Pipeline concurrency control
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

## Initial KPI catalogue

| KPI | Description | Expected unit | Target value | Category | Source URLs |
| --- | --- | --- | ---: | --- | --- |
| Digital economy share of GDP | Share of Ethiopia's GDP attributed to the digital economy. | percent | 12 | Empower People & Institutions | `https://www.digitalethiopia.tech/` |
| Digital jobs (ICT/BPO/tech) | Jobs created in ICT, BPO, and technology-enabled services. | jobs | 1000000 | Empower People & Institutions | `https://www.digitalethiopia.tech/` |
| Digital exports | Export revenue from digital and digitally enabled services. | USD | 3000000000 | Empower People & Institutions | `https://www.digitalethiopia.tech/` |
| Basic certifications (5M Coders) | Enrollment or certification count for the 5 Million Ethiopian Coders initiative. | enrollments/certifications | 5000000 | Accelerate Inclusive Digital Economic Growth | `https://www.digitalethiopia.tech/`; `https://www.gcs.gov.et/en/2026/06/11/%F0%9D%90%8E%F0%9D%90%8D%F0%9D%90%86%F0%9D%90%91%F0%9D%90%80%F0%9D%90%93%F0%9D%90%94%F0%9D%90%8B%F0%9D%90%80%F0%9D%90%93%F0%9D%90%88%F0%9D%90%8E%F0%9D%90%8D%F0%9D%90%92-%F0%9D%90%85%F0%9D%90%84/` |
| Fayda digital ID registrations | Residents registered for Ethiopia's Fayda digital identification system. | registrations | 90000000 | Cross-Cutting | `https://id.gov.et/strategies`; `https://www.id.gov.et/worldbank` |
| Internet penetration | Share of the population using or covered by internet access, depending on source definition. | percent |  | Achieve Universal Digital Access | `https://www.digitalethiopia.tech/` |
| G2C services available online | Government-to-citizen services available online. | services |  | Achieve Universal Digital Access | `https://www.digitalethiopia.tech/` |
| 4G mobile broadband coverage | Share of population or geography covered by 4G mobile broadband, depending on source definition. | percent |  | Achieve Universal Digital Access | `https://www.digitalethiopia.tech/` |
| Digital FDI inflows | Foreign direct investment inflows into digital sectors. | USD |  | Position Ethiopia for Digital FDI | `https://www.digitalethiopia.tech/` |
| Global hyperscalers | Count of global hyperscale cloud or infrastructure providers active in Ethiopia. | providers |  | Position Ethiopia for Digital FDI | `https://www.digitalethiopia.tech/` |

## Open questions
None.
