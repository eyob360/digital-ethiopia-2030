---
id: WO-0006
title: n8n ingestion workflow
implements: [BRD-0002.R1, BRD-0002.R2, BRD-0002.R3, BRD-0002.R7, BRD-0002.R8, BRD-0002.N1, BRD-0002.N2]
blueprint: BP-0001
depends-on: [WO-0004]
units-touched: []
status: ready
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

### BRD-0002.N1: Retry behavior
- AC1: When HTTP request, OpenAI relevance, OpenAI extraction, or database operations fail transiently, the system shall retry the failed node up to 5 times with 2 seconds between tries.
- AC2: When a node is retried, the system shall not rerun earlier successful nodes in the branch.

### BRD-0002.N2: MVP cost controls
- AC1: When the pipeline runs, the system shall process no more than 10 documents per hour.
- AC2: When the pipeline runs, the system shall process no more than 5 URLs per KPI.
- AC3: When the MVP is implemented, the system shall not require a vector database, distributed processing, data warehouse, paid data APIs, complex ML models, real-time streaming, multi-language processing, or advanced entity resolution.

## Implementation notes
- Cite and follow [D-0007](../decisions/D-0007-fallback-search-provider.md).
- Do not duplicate deterministic rule logic inside n8n if a versioned app helper/API exists.
- Do not commit secrets or real n8n credentials.

## Testing plan
- `npm run lint`
- `npm test`
- `npm run build`
- Validate the n8n workflow export/documentation shape.
- Use mocked OpenAI/Tavily responses for local tests where live credentials are unavailable.
- Manual dry-run documentation for expected operational path.
