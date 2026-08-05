---
id: WO-0006
title: n8n ingestion workflow
implements: [BRD-0002.R1, BRD-0002.R2, BRD-0002.R3, BRD-0002.R4, BRD-0002.R5, BRD-0002.R6, BRD-0002.R7, BRD-0002.R8, BRD-0002.R9, BRD-0002.R10, BRD-0002.R11, BRD-0002.N1, BRD-0002.N2]
blueprint: BP-0001
depends-on: [WO-0004]
units-touched: [UNIT-0009, UNIT-0019, UNIT-0035, UNIT-0036, UNIT-0037, UNIT-0038, UNIT-0039]
status: done
---

# WO-0006: n8n ingestion workflow

## Summary
Implement the scheduled n8n ingestion workflow that loads eligible KPIs, checks priority URLs, falls back to AI-generated Tavily search, filters/fetches content, gates relevance, extracts strict JSON observations, and stores accepted observations through the approved persistence boundary.

## In scope
- n8n workflow export or documented workflow source.
- Cron schedule and pipeline lock usage.
- KPI loading with batch limits.
- Priority URL first path.
- OpenAI query generation, relevance classification, and structured extraction prompts.
- Tavily fallback search provider use.
- Per-node retry settings.
- Integration with deterministic rules/API boundaries from prior work orders.

## Out of scope
- Dashboard UI.
- Human validation interface.
- Source credibility scoring.
- Queue systems or vector search.

## Requirements

### BRD-0002.R1: Priority source retrieval
- AC1: When a KPI has `source_urls`, the pipeline shall check those URLs before generating fallback web search queries.
- AC2: When priority URLs yield a valid observation, the pipeline shall not use fallback web search for that KPI in the same run.
- AC3: When priority URLs do not yield a valid observation, the pipeline shall continue to fallback AI-generated search.

### BRD-0002.R2: AI query generation
- AC1: When fallback search is needed, the system shall send KPI name and description to the OpenAI API.
- AC2: When query generation succeeds, the system shall receive a JSON array of 3 to 5 search queries.
- AC3: When query generation returns invalid JSON, the system shall reject the query-generation result.

### BRD-0002.R3: Fallback search provider
- AC1: When fallback web search is configured for MVP, the system shall use Tavily as the initial provider.
- AC2: When fallback web search executes, the system shall call the provider through an internal search-provider abstraction.
- AC3: When provider credentials are missing, the system shall fail the fallback search branch with a clear configuration error.
- AC4: When the provider is changed later, the pipeline shall not require changes to KPI definitions.

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

### BRD-0002.R7: AI relevance gate
- AC1: When a new raw document is available, the system shall classify relevance using an OpenAI classification prompt.
- AC2: When relevance classification succeeds, the system shall return strict structured output containing `relevant` and `confidence`.
- AC3: When `relevant` is false, the system shall stop processing that document branch.
- AC4: When classification output is invalid, the system shall reject the classification result.

### BRD-0002.R8: Structured KPI extraction
- AC1: When a document is relevant, the system shall request strict JSON extraction from the OpenAI API.
- AC2: When extraction succeeds, the result shall include `value_numeric`, `unit`, `region`, `observed_date`, `explanation`, and `confidence`.
- AC3: When extraction output is not strict structured JSON, the system shall reject the extraction result.
- AC4: When extraction succeeds, the system shall not use AI to perform deterministic normalization or final confidence threshold decisions.

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

### BRD-0002.R11: Append-only observation history
- AC1: When a new observation is accepted, the system shall insert it as a new `kpi_observations` row.
- AC2: When a new observation is accepted, the system shall not overwrite old observations for the same KPI.
- AC3: When dashboard consumers need the current value, the latest observation shall be queryable by ordering observations by `created_at` descending.

### BRD-0002.N1: Retry behavior
- AC1: When HTTP request, OpenAI relevance, OpenAI extraction, or database operations fail transiently, the system shall retry the failed node up to 5 times with 2 seconds between tries.
- AC2: When a node is retried, the system shall not rerun earlier successful nodes in the branch.

### BRD-0002.N2: MVP cost controls
- AC1: When the pipeline runs, the system shall process no more than 10 documents per hour.
- AC2: When the pipeline runs, the system shall process no more than 5 URLs per KPI.
- AC3: When the MVP is implemented, the system shall not require a vector database, distributed processing, data warehouse, paid data APIs, complex ML models, real-time streaming, multi-language processing, or advanced entity resolution.

## Implementation notes
- Cite and follow [D-0007](../decisions/D-0007-fallback-search-provider.md), [D-0008](../decisions/D-0008-url-domain-filtering.md), and [D-0009](../decisions/D-0009-raw-document-deduplication.md).
- Do not duplicate deterministic rule logic inside n8n if a versioned app helper/API exists.
- Do not commit secrets or real n8n credentials.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- Validate the n8n workflow export/documentation shape.
- Use mocked OpenAI/Tavily responses for local tests where live credentials are unavailable.
- Manual dry-run documentation for expected operational path.

## Completion evidence
- 2026-08-05: `npm run lint` passed.
- 2026-08-05: `npm test` passed, 18 files / 61 tests.
- 2026-08-05: `npm run build` passed.
- 2026-08-05: `npm run format` passed.
- 2026-08-05: `npx prisma validate` passed.
- 2026-08-05: `node -e "JSON.parse(require('fs').readFileSync('n8n/workflows/digital-ethiopia-ingestion.json','utf8')); console.log('workflow json ok')"` passed.
- 2026-08-05: workflow export test validated required n8n nodes, app ingestion API boundaries, priority/fallback connections, retry settings, and mocked OpenAI/Tavily response shapes.
- 2026-08-05: local route checks on port 3010 verified ingestion API bearer denial (`401`), deterministic URL filtering (`200` with blocked social URL removed), and clear missing Tavily config error (`500`, `TAVILY_API_KEY is not configured`).
