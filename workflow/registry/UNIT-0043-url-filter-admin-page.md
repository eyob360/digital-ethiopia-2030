---
id: UNIT-0043
name: URL filter admin page
kind: page
path: src/app/admin/url-filter/page.tsx
status: active
---

# UNIT-0043: URL filter admin page

**Purpose:** Operator page for editing the ingestion URL filter's blocked/allowed override lists and seeing the default blocked categories.

**Interface:** Route `/admin/url-filter`; server component that loads session + stored config and renders `UrlFilterConfigWorkspace` inside `AppShell`.

**Variants/options:** Redirects non-operators to `/` (same gating as the KPI admin page).
