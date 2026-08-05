---
id: VAL-WO-0003
work-order: WO-0003
date: 2026-08-05
result: pass
---

# Validation: WO-0003

Validated by a session that did not implement the work order. Scope note: WO-0003 delivers the deterministic decision helpers; database persistence, fetching, and n8n wiring are explicitly out of scope and land in WO-0004/WO-0006. ACs are validated at the helper level accordingly.

| Criterion | Verdict | Evidence |
|---|---|---|
| BRD-0001.R5.AC1 (no observations → eligible) | pass | `isKpiEligibleForIngestion` returns true when latest observation is absent (`src/lib/pipeline/fetch-eligibility.ts:12-14`); tested |
| BRD-0001.R5.AC2-AC4 (interval comparison) | pass | Strict `latest < now - fetch_interval_hours` comparison (`fetch-eligibility.ts:21-23`); tests cover older-than (eligible), exact-threshold and newer (skip), and invalid-interval fallback to 24h |
| BRD-0002.R4.AC1/AC4 (≤5 URLs) | pass | `maxUrls` defaults to 5, loop breaks at cap (`url-filter.ts:12,77-79`); test "deduplicates valid allowed URLs and caps output at five" |
| BRD-0002.R4.AC2 (dedupe) | pass | Canonicalized-URL `seen` set (hash stripped, hostname/port normalized) drops duplicates (`url-filter.ts:64-67,94-106`); tested |
| BRD-0002.R4.AC3/AC5 (block invalid/social/shorteners/etc.) | pass | Default block list covers social (facebook, x, tiktok, instagram, linkedin), search pages (google.com), shorteners (bit.ly, t.co), file sharing (drive.google.com, dropbox), low-signal forums (reddit, medium); non-HTTP(S) and unparseable URLs dropped; test "removes invalid, blocked, and unknown domains by default" |
| BRD-0002.R4.AC6 (allow official sources) | pass | Default allow list of Ethiopian government/regulator/telecom/statistics/development-partner/news domains (`url-filter.ts:31-43`), matching D-0008's accepted policy |
| BRD-0002.R4.AC7 (operator-configurable) | pass | `UrlFilterConfig` accepts `allowedDomains`/`blockedDomains`/`maxUrls` at runtime — no code change; test "lets operator configuration allow and block domains without code changes". Operator-facing config surface arrives with later WOs |
| BRD-0002.R5.AC2-AC4 / R6.AC1-AC3 (hash-before-store, no duplicate rows) | pass | `createContentHash` = SHA256 hex over raw text; `shouldStoreRawDocument` returns false for known hashes (`content-hash.ts`), implementing D-0009's hash-first decision; tested for stability and duplicate-skip. Fetching itself (R5.AC1/AC5) is WO-0006 scope |
| BRD-0002.R9.AC1-AC3 (normalization) | pass | `%`/`percentage` → `percent` with 0–100 range enforcement; `$`/`usd` → `USD` with k/m/b and thousand/million/billion scaling; dates → ISO `YYYY-MM-DD` (`normalization.ts`); tested |
| BRD-0002.R9.AC4 (reject when invalid) | pass | `normalizeObservationCandidate` returns null when value, unit, date, or source URL cannot be normalized (`normalization.ts:33-35`); test "rejects invalid value, unit, date, and source inputs" |
| BRD-0002.R10.AC1-AC3 (confidence gate) | pass | ≥0.85 insert unflagged; ≥0.6 and <0.85 insert flagged; <0.6 or invalid reject (`confidence.ts:14-22`); boundary values tested on both sides of each threshold |
| BRD-0002.R10.AC4 (observation fields) | pass | Normalized output carries value/unit/region/observed_date/source_url; `kpi_id`, `ai_confidence`, `review_flag`, `created_at` columns exist in `KpiObservation` (WO-0002 schema); persistence wiring is WO-0004 scope |
| Testing plan | pass | `npm run lint` clean; `npm test` 29/29 across 9 files; `npm run build` succeeds; no new dependencies added |
| Registry | pass | UNIT-0010 … UNIT-0014 files exist and are indexed in `REGISTRY.md` |

## Drift observed
None against BRDs, BP-0001, D-0008, or D-0009.

One interpretation worth confirming: the URL filter is **allow-list-only** — a domain on neither list (e.g. an official source not yet in the default list, like `mint.gov.et`) is rejected until an operator adds it. This is the conservative reading of D-0008/AC6 ("allow official … sources by default" implemented as a concrete default list), and operator config covers gaps, but it means new legitimate sources are silently dropped by default.

## Failures
None.

## Merge status
Held for user review before merge — the confidence thresholds and URL filtering policy are core business rules, which conventions flag for user review even after validation passes.
