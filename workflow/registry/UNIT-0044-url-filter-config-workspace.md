---
id: UNIT-0044
name: URL filter config workspace
kind: component
path: src/components/forms/url-filter-config-workspace.tsx
status: active
---

# UNIT-0044: URL filter config workspace

**Purpose:** Client form for operators to edit blocked/allowed domain override lists (one domain per line) and view the default blocked categories.

**Interface:** `UrlFilterConfigWorkspace({ initialConfig, defaultBlockedDomainCategories })`; saves via `PUT /api/url-filter-config`.

**Variants/options:** None.
