---
id: UNIT-0042
name: URL filter config API
kind: endpoint
path: src/app/api/url-filter-config/route.ts
status: active
---

# UNIT-0042: URL filter config API

**Purpose:** Operator-facing API for reading and saving the URL filter override lists without code changes (BRD-0002.R4.AC7).

**Interface:** `GET /api/url-filter-config` → `{ config, defaultBlockedDomainCategories }`; `PUT /api/url-filter-config` with `{ blockedDomains, allowedDomains }` → `{ config }`.

**Variants/options:** Both methods require the OPERATOR role via `requireApiRole`.
