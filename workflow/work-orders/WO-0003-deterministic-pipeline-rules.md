---
id: WO-0003
title: Deterministic pipeline rules
implements: [BRD-0001.R5, BRD-0002.R4, BRD-0002.R5, BRD-0002.R6, BRD-0002.R9, BRD-0002.R10]
blueprint: BP-0001
depends-on: [WO-0002]
units-touched: []
status: ready
---

# WO-0003: Deterministic pipeline rules

## Summary
Implement tested TypeScript utilities for all deterministic ingestion rules that must not live only inside n8n: fetch eligibility, URL filtering, content hashing/dedupe decisions, normalization, and confidence gates.

## In scope
- Fetch-interval eligibility helper.
- URL filtering and deduplication policy helpers.
- SHA256 content hashing helper.
- Observation normalization helpers for dates, percentages, and currency.
- Confidence gate helper.
- Unit tests covering edge cases and decision thresholds.

## Out of scope
- Database persistence.
- OpenAI/Tavily clients.
- n8n workflow implementation.
- Dashboard rendering.

## Requirements

### BRD-0001.R5: Per-KPI fetch eligibility
- AC1: When a KPI has no observations, the system shall consider it eligible for ingestion.
- AC2: When a KPI has observations, the system shall compare the latest observation `created_at` with `now - fetch_interval_hours`.
- AC3: When the latest observation is older than `now - fetch_interval_hours`, the system shall consider the KPI eligible for ingestion.
- AC4: When the latest observation is not older than `now - fetch_interval_hours`, the system shall skip ingestion for that KPI.

### BRD-0002.R4: Web search and URL controls
- AC1: When executing generated queries, the system shall extract no more than the top 5 URLs for a KPI.
- AC2: When candidate URLs are gathered, the system shall remove duplicate URLs.
- AC3: When candidate URLs are gathered, the system shall remove invalid domains according to configured filtering rules.
- AC4: When candidate URL filtering completes, the system shall pass no more than 5 URLs to content fetching for a KPI.
- AC5: When filtering candidate URLs, the system shall block social/media aggregators, search-result pages, URL shorteners, file-sharing pages, login-only sites, and low-signal forums by default.
- AC6: When filtering candidate URLs, the system shall allow official government, regulator, telecom, development-partner, recognized news, and statistics sources by default.
- AC7: When default filtering rules are insufficient, the system shall allow operators to configure blocked and allowed domains without code changes.

### BRD-0002.R5: Content fetching and raw document storage
- AC1: When a candidate URL is fetched, the system shall extract readable raw text from the response.
- AC2: When raw text is available, the system shall compute a content hash before deciding whether to store the raw document.
- AC3: When the content hash is new, the system shall store `source_url`, `raw_text`, `content_hash`, and `created_at` in `raw_documents`.
- AC4: When the content hash already exists, the system shall not create another `raw_documents` row for the duplicate content.
- AC5: When fetching fails after retry handling, the system shall skip that candidate URL without stopping unrelated KPI processing.

### BRD-0002.R6: Duplicate document detection
- AC1: When raw text is fetched, the system shall generate a SHA256 content hash.
- AC2: When the content hash already exists in the database, the system shall stop processing that document branch before AI relevance classification.
- AC3: When the content hash is new, the system shall store the raw document and continue to relevance classification.

### BRD-0002.R9: Deterministic normalization
- AC1: When an observation candidate contains percentages, the system shall normalize them according to deterministic rules.
- AC2: When an observation candidate contains currency values, the system shall normalize them according to deterministic rules.
- AC3: When an observation candidate contains dates, the system shall standardize them to ISO format.
- AC4: When normalization cannot produce a valid value, unit, and date, the system shall reject the observation candidate.

### BRD-0002.R10: Confidence-based storage
- AC1: When normalized confidence is at least 0.85, the system shall insert the observation without a review flag.
- AC2: When normalized confidence is at least 0.6 and below 0.85, the system shall insert the observation with a review flag.
- AC3: When normalized confidence is below 0.6, the system shall reject the observation.
- AC4: When an observation is inserted, the system shall store `kpi_id`, `value`, `unit`, `region`, `observed_date`, `source_url`, `ai_confidence`, `review_flag`, and `created_at`.

## Implementation notes
- Cite and follow [D-0008](../decisions/D-0008-url-domain-filtering.md) and [D-0009](../decisions/D-0009-raw-document-deduplication.md).
- Keep deterministic business rules in versioned app code, not only in n8n Function nodes.
- Register reusable utilities/validators in `workflow/registry/`.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- Unit tests for every threshold, invalid input path, and representative unit/date normalization.
