---
id: UNIT-0013
name: Observation normalization
kind: util
path: src/lib/pipeline/normalization.ts
status: active
---

# UNIT-0013: Observation normalization

**Purpose:** Normalizes observation candidate values, units, dates, default region, and source URL into storage-ready shape.

**Interface:** `normalizeObservationCandidate(candidate)`, `normalizeObservedDate(value)`, `normalizeUnit(unit)`, and `normalizeValue(value, unit)`.

**Variants/options:** Rejects invalid value/unit/date/source combinations by returning `null`.
