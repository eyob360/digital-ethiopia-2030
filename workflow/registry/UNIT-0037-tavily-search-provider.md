---
id: UNIT-0037
name: Tavily search provider
kind: service
path: src/server/search/tavily.ts
status: active
---

# UNIT-0037: Tavily search provider

**Purpose:** Internal fallback-search provider abstraction with Tavily as the MVP implementation.

**Interface:** `TavilySearchProvider.search({ queries, maxResults })` and `parseSearchInput(input)`.

**Variants/options:** Requires `TAVILY_API_KEY`; deduplicates returned URLs and caps results.
