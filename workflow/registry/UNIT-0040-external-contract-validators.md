---
id: UNIT-0040
name: External contract validators
kind: validator
path: src/lib/integration/external-contracts.ts
status: active
---

# UNIT-0040: External contract validators

**Purpose:** Parses checked-in OpenAI and Tavily mock responses into the strict shapes expected by the ingestion workflow.

**Interface:** `parseOpenAiQueryGeneration`, `parseOpenAiRelevance`, `parseOpenAiExtraction`, and `parseTavilySearchResponse`.

**Variants/options:** Returns `null` for malformed responses so contract tests can cover invalid external payloads without live credentials.
