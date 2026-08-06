---
id: UNIT-0011
name: URL filter
kind: util
path: src/lib/pipeline/url-filter.ts
status: active
---

# UNIT-0011: URL filter

**Purpose:** Canonicalizes, deduplicates, caps, and domain-filters candidate ingestion URLs using blocklist-with-default-allow (D-0019): default block patterns cover BRD-0002.R4.AC5's categories; every other domain passes.

**Interface:** `filterCandidateUrls(candidateUrls, config?)`; exports `defaultBlockedDomains` and `defaultBlockedDomainCategories`.

**Variants/options:** `config.blockedDomains` adds operator block rules; `config.allowedDomains` wins over every block rule (including defaults); `maxUrls` defaults to 5.
