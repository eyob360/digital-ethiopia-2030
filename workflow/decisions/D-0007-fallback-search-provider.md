---
id: D-0007
date: 2026-08-05
kind: decision
status: active
relates-to: [BRD-0002]
supersedes:
superseded-by:
---

# D-0007: Fallback search provider

**Question:** Which fallback web search provider should the MVP pipeline use?

**Decision:** Implement a configurable search-provider abstraction and use Tavily as the initial MVP provider.

**Why:** The user accepted the recommended configurable-provider approach. Tavily is a practical MVP default because it supports API-based web search and URL extraction, offers a free monthly credit tier, and avoids scraping search-result pages directly.
