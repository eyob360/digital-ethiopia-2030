---
id: UNIT-0011
name: URL filter
kind: util
path: src/lib/pipeline/url-filter.ts
status: active
---

# UNIT-0011: URL filter

**Purpose:** Canonicalizes, deduplicates, caps, and domain-filters candidate ingestion URLs.

**Interface:** `filterCandidateUrls(candidateUrls, config?)`.

**Variants/options:** Supports configurable `allowedDomains`, `blockedDomains`, and `maxUrls`; defaults to at most 5 URLs.
