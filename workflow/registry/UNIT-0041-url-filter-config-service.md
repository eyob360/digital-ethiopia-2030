---
id: UNIT-0041
name: URL filter config service
kind: service
path: src/server/url-filter-config.ts
status: active
---

# UNIT-0041: URL filter config service

**Purpose:** Reads and updates the operator-maintained URL filter override lists (blocked/allowed domains, D-0019) stored in the singleton `url_filter_configs` row.

**Interface:** `getUrlFilterConfig(client?)`, `updateUrlFilterConfig(input, client?)`, `parseUrlFilterConfigInput(input)` — parse normalizes pasted URLs/hostnames to lowercase domains and rejects invalid entries.

**Variants/options:** Missing row serializes as empty override lists, so defaults apply until an operator saves.
