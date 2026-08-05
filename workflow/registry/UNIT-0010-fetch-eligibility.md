---
id: UNIT-0010
name: Fetch eligibility
kind: util
path: src/lib/pipeline/fetch-eligibility.ts
status: active
---

# UNIT-0010: Fetch eligibility

**Purpose:** Determines whether a KPI should be ingested based on latest observation age and fetch interval.

**Interface:** `isKpiEligibleForIngestion(input)`.

**Variants/options:** Defaults to a 24-hour interval when no valid interval is supplied.
