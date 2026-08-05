---
id: BRD-0002
title: Intelligence ingestion pipeline
source: srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Priority URLs vs Web Search; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 3: AI Query Generator; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 4: Web Search Layer; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 5: URL Filtering & Deduplication; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 6: Content Fetching; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 7: Hashing & Duplicate Detection; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 8: Relevance Classification (AI Gate); srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 9: Structured Data Extraction (Core Intelligence Layer); srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 10: Deterministic Normalization; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 11: Confidence Gate; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#Layer 12: KPI Observation Storage; srs/Digital Ethiopia 2030 Intelligence Dashboard.md#5. Operational Safeguards
status: draft
---

# BRD-0002: Intelligence ingestion pipeline

## Overview
This feature collects candidate web content for eligible KPIs, filters and deduplicates it, extracts structured KPI observations using controlled AI prompts, normalizes the extracted data deterministically, and stores accepted observations for dashboard use.

## Terminology
- Candidate URL: a URL selected for possible KPI evidence.
- Raw document: fetched page text stored with its source URL and content hash.
- Relevance classification: AI decision on whether a document contains KPI-relevant information.
- Structured extraction: AI conversion of relevant text into a strict KPI observation JSON object.
- Confidence gate: rule that decides whether to insert, flag, or reject an extracted observation.

## Requirements

### BRD-0002.R1: Priority source retrieval
As a program analyst, I want configured source URLs checked before broad web search so that official or trusted sources are preferred.

**Acceptance criteria:**
- AC1: When a KPI has `source_urls`, the pipeline shall check those URLs before generating fallback web search queries.
- AC2: When priority URLs yield a valid observation, the pipeline shall not use fallback web search for that KPI in the same run.
- AC3: When priority URLs do not yield a valid observation, the pipeline shall continue to fallback AI-generated search.

### BRD-0002.R2: AI query generation
As a program analyst, I want search queries generated from KPI metadata so that relevant sources can be discovered without hardcoded phrases.

**Acceptance criteria:**
- AC1: When fallback search is needed, the system shall send KPI name and description to the OpenAI API.
- AC2: When query generation succeeds, the system shall receive a JSON array of 3 to 5 search queries.
- AC3: When query generation returns invalid JSON, the system shall reject the query-generation result.

### BRD-0002.R3: Fallback search provider
As a technical operator, I want fallback web search routed through a configurable provider so that the MVP can start with Tavily without locking the system to one vendor.

**Acceptance criteria:**
- AC1: When fallback web search is configured for MVP, the system shall use Tavily as the initial provider.
- AC2: When fallback web search executes, the system shall call the provider through an internal search-provider abstraction.
- AC3: When provider credentials are missing, the system shall fail the fallback search branch with a clear configuration error.
- AC4: When the provider is changed later, the pipeline shall not require changes to KPI definitions.

### BRD-0002.R4: Web search and URL controls
As a technical operator, I want bounded web search so that the MVP avoids crawler-like behavior and cost spikes.

**Acceptance criteria:**
- AC1: When executing generated queries, the system shall extract no more than the top 5 URLs for a KPI.
- AC2: When candidate URLs are gathered, the system shall remove duplicate URLs.
- AC3: When candidate URLs are gathered, the system shall remove invalid domains according to configured filtering rules.
- AC4: When candidate URL filtering completes, the system shall pass no more than 5 URLs to content fetching for a KPI.
- AC5: When filtering candidate URLs, the system shall block social/media aggregators, search-result pages, URL shorteners, file-sharing pages, login-only sites, and low-signal forums by default.
- AC6: When filtering candidate URLs, the system shall allow official government, regulator, telecom, development-partner, recognized news, and statistics sources by default.
- AC7: When default filtering rules are insufficient, the system shall allow operators to configure blocked and allowed domains without code changes.

### BRD-0002.R5: Content fetching and raw document storage
As a technical operator, I want fetched source content stored so that observations can be audited back to evidence.

**Acceptance criteria:**
- AC1: When a candidate URL is fetched, the system shall extract readable raw text from the response.
- AC2: When raw text is available, the system shall store `source_url`, `raw_text`, `content_hash`, and `created_at` in `raw_documents`.
- AC3: When fetching fails after retry handling, the system shall skip that candidate URL without stopping unrelated KPI processing.

### BRD-0002.R6: Duplicate document detection
As a technical operator, I want identical documents skipped so that the system avoids redundant processing and AI costs.

**Acceptance criteria:**
- AC1: When raw text is fetched, the system shall generate a SHA256 content hash.
- AC2: When the content hash already exists in the database, the system shall stop processing that document branch.
- AC3: When the content hash is new, the system shall continue to relevance classification.

### BRD-0002.R7: AI relevance gate
As a program analyst, I want irrelevant documents rejected before extraction so that the system avoids noisy observations.

**Acceptance criteria:**
- AC1: When a new raw document is available, the system shall classify relevance using an OpenAI classification prompt.
- AC2: When relevance classification succeeds, the system shall return strict structured output containing `relevant` and `confidence`.
- AC3: When `relevant` is false, the system shall stop processing that document branch.
- AC4: When classification output is invalid, the system shall reject the classification result.

### BRD-0002.R8: Structured KPI extraction
As a program analyst, I want relevant documents converted into normalized observation candidates so that unstructured text becomes measurable KPI data.

**Acceptance criteria:**
- AC1: When a document is relevant, the system shall request strict JSON extraction from the OpenAI API.
- AC2: When extraction succeeds, the result shall include `value_numeric`, `unit`, `region`, `observed_date`, `explanation`, and `confidence`.
- AC3: When extraction output is not strict structured JSON, the system shall reject the extraction result.
- AC4: When extraction succeeds, the system shall not use AI to perform deterministic normalization or final confidence threshold decisions.

### BRD-0002.R9: Deterministic normalization
As a technical operator, I want extracted units and dates normalized by rules so that stored observations are consistent and auditable.

**Acceptance criteria:**
- AC1: When an observation candidate contains percentages, the system shall normalize them according to deterministic rules.
- AC2: When an observation candidate contains currency values, the system shall normalize them according to deterministic rules.
- AC3: When an observation candidate contains dates, the system shall standardize them to ISO format.
- AC4: When normalization cannot produce a valid value, unit, and date, the system shall reject the observation candidate.

### BRD-0002.R10: Confidence-based storage
As a program analyst, I want confidence thresholds applied before storage so that dashboard integrity is protected.

**Acceptance criteria:**
- AC1: When normalized confidence is at least 0.85, the system shall insert the observation without a review flag.
- AC2: When normalized confidence is at least 0.6 and below 0.85, the system shall insert the observation with a review flag.
- AC3: When normalized confidence is below 0.6, the system shall reject the observation.
- AC4: When an observation is inserted, the system shall store `kpi_id`, `value`, `unit`, `region`, `observed_date`, `source_url`, `ai_confidence`, `review_flag`, and `created_at`.

### BRD-0002.R11: Append-only observation history
As a decision maker, I want every accepted KPI value retained historically so that the dashboard can show current state and time series.

**Acceptance criteria:**
- AC1: When a new observation is accepted, the system shall insert it as a new `kpi_observations` row.
- AC2: When a new observation is accepted, the system shall not overwrite old observations for the same KPI.
- AC3: When dashboard consumers need the current value, the latest observation shall be queryable by ordering observations by `created_at` descending.

## Non-functional requirements

### BRD-0002.N1: Retry behavior
- AC1: When HTTP request, OpenAI relevance, OpenAI extraction, or database operations fail transiently, the system shall retry the failed node up to 5 times with 2 seconds between tries.
- AC2: When a node is retried, the system shall not rerun earlier successful nodes in the branch.

### BRD-0002.N2: MVP cost controls
- AC1: When the pipeline runs, the system shall process no more than 10 documents per hour.
- AC2: When the pipeline runs, the system shall process no more than 5 URLs per KPI.
- AC3: When the MVP is implemented, the system shall not require a vector database, distributed processing, data warehouse, paid data APIs, complex ML models, real-time streaming, multi-language processing, or advanced entity resolution.

## Out of scope
- Human validation interface.
- Source credibility scoring.
- Queue systems such as Redis.
- Vector search or chatbot behavior.

## Open questions
- Should raw documents be stored before or after duplicate detection when the same content hash already exists?
