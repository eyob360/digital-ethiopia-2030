---
id: UNIT-0014
name: Confidence gate
kind: util
path: src/lib/pipeline/confidence.ts
status: active
---

# UNIT-0014: Confidence gate

**Purpose:** Applies deterministic confidence thresholds for insert, review-flag, and reject decisions.

**Interface:** `applyConfidenceGate(confidence)` and `normalizeConfidence(confidence)`.

**Variants/options:** Inserts without review at `>= 0.85`, inserts with review from `>= 0.6` to `< 0.85`, and rejects below `0.6`. The range check is delegated to `parseConfidence` in UNIT-0040 (single confidence contract): only finite numbers on the documented 0-1 scale are accepted; out-of-range values (including 1-100 style percentages) are rejected, never rescaled (WO-0013).
