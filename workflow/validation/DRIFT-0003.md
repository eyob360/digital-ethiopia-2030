---
id: DRIFT-0003
date: 2026-08-06
covers: ff0db3e..51191bc
---

# Drift audit 3

Covers the 28 commits since DRIFT-0002's endpoint (`ff0db3e`): WO-0009 (lock lifecycle + budget), WO-0010 (fallback reachability, 4 validation rounds), WO-0011 (operator-configurable URL filtering), WO-0012 (NFR coverage), the WO-0005 re-validation (Playwright + axe per D-0018, contrast fix), decisions D-0018–D-0021, and docs-only instruction/reconciliation commits. Unmerged branches `wo-0013-…` and `wo-0014-…` are exempt from the code audit per the audit rules (held for user review), but their index lines are reconciled below.

## Code vs BRD contradictions

**No new contradictions found.** Every code change in the range belongs to a validated work order, and the diffs match the requirements they cite:

- `src/server/pipeline.ts` / migration `0003`: run-scoped lock with branch accounting satisfies BRD-0001.R6.AC1–AC4; release now happens only after every KPI branch reports terminal completion. The stale-lock recovery path (acquire steals a lock older than `PIPELINE_LOCK_STALE_AFTER_MINUTES`, default 120) goes beyond the literal "stop when lock is true" of R6.AC2, but is an explicitly scoped, user-review-gated design in WO-0009 and validated in VAL-WO-0009 — recorded, not drift.
- `src/lib/pipeline/url-filter.ts`, `src/server/url-filter-config.ts`, `/api/url-filter-config`, `/admin/url-filter`, migration `0004`: blocklist-with-default-allow with DB-backed operator overrides implements BRD-0002.R4.AC5–AC7 exactly as D-0019 records (default-allow is how AC6's open-ended source categories pass without enumeration). DRIFT-0002 finding 3 is closed.
- `/api/ingestion/observations` now returns 200 with `status: "rejected"` (was 422) so n8n can route rejected candidates to fallback — BRD-0002.R10.AC3's rejection is expressed in the payload, and BRD-0002.R1.AC3 (fallback after failed priority URLs) is now reachable. DRIFT-0002 finding 2 is closed.
- n8n workflow: `Apply Document Budget` removed; the app raw-document endpoint is the single atomic 10-document counter (BRD-0002.N2.AC1). IF nodes migrated to v2 filter format per D-0021; context carried via `runId`/`branchKey` back-references. DRIFT-0002 finding 1 is closed.
- `src/lib/dependency-guard.test.ts` + workflow-export/separation evidence: covers BRD-0001.N1.AC1 and BRD-0003.N1.AC1 as revised by D-0020 (DRIFT-0002 traceability gap closed; BRD text edits in the range are exactly the D-0020-sanctioned revisions).
- `globals.css` success token 35%→29% lightness and the e2e/Playwright harness are the D-0018 re-validation of WO-0005 (WCAG 2.2 AA, D-0013); new dev dependencies (`@playwright/test`, `@axe-core/playwright`) are sanctioned by D-0018.

## Known open drift (carried, not re-litigated)

The four n8n real-runtime defects recorded in STATE.md's Blocked section (VAL-WO-0010 Drift items 1–4: stale `responseFormat` on `Fetch Priority URL`, multi-KPI batch collapse in all-items Code nodes, `$env` access denied in n8n 2.33.0 expressions, invalid `={...}` jsonBody form on 7 of 9 body-bearing nodes) remain open pending the user's decision on a consolidated fix WO. Affected: BRD-0002, WO-0006, WO-0010.

## Registry

All 44 REGISTRY.md index lines and every UNIT file `path:` resolve to existing files on `main`, including the new UNIT-0041–UNIT-0044 (URL filter config service/API/page/workspace). UNIT-0045 (string helpers, `src/lib/strings.ts`) exists only on the unmerged `wo-0013`/`wo-0014` branches and resolves there; it will enter `main`'s registry with those merges.

## Structural sweep

- All BRD/BP/WO/VAL/DRIFT/D/UNIT IDs unique; every `implements:`/`depends-on:`/`blueprint:` target exists; WOs without a BRD (WO-0001, WO-0007, WO-0008, WO-0013, WO-0014) are all `implements: none` maintenance/foundation WOs — allowed.
- Every item file has exactly one index line (STATE.md, ARCHIVE.md, DECISIONS.md, REGISTRY.md) and frontmatter statuses agree with index lines, after one reconciliation:
  - **WO-0013 / WO-0014 index mismatch (repaired this audit).** `main`'s STATE.md listed both as `ready`, while their branch-side frontmatter says `validated` (VAL-WO-0013 pass at `ff311e2`+validation commit; VAL-WO-0014 pass at `4af7b9d`). Evidence wins per rule 3: both are validated on their branches, with merges held for user review under the sensitive-area convention — the branch-side docs cannot land on `main` until then. STATE.md lines updated to say so.
- Decisions D-0001–D-0021: all 21 files indexed in DECISIONS.md, all `status: active`, none superseded; D-0019 coherently *refines* D-0008 (mechanism for the recorded category intent) rather than contradicting it.

## Affected doc IDs

BRD-0001, BRD-0002, BRD-0003, BP-0001, WO-0005, WO-0009, WO-0010, WO-0011, WO-0012, WO-0013, WO-0014, D-0018, D-0019, D-0020, D-0021, UNIT-0041–UNIT-0045.
