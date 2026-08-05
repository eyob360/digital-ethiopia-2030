---
id: DRIFT-0002
date: 2026-08-05
covers: b379055..ff0db3e
---

# Drift audit 2

Covers the ~34 commits since DRIFT-0001's endpoint (`b379055`): WO-0005 (dashboard UI), WO-0006 (n8n ingestion workflow), WO-0007 (integration hardening), WO-0008 (maintenance cleanup), their validations and merges, and the rework encoding driven by the user's rejection of MVP completion (D-0017). Findings below were confirmed against the code; each is tracked by a work order or was repaired in place — none were silently fixed.

## Code vs BRD contradictions (open, tracked)

1. **Pipeline lock released by first-finishing branch; budget guard dead; no crash recovery** — contradicts BRD-0001.R6.AC4 and BRD-0002.N2.AC1. `releasePipelineLock` (`src/server/pipeline.ts:39`) resets `documentsProcessed` and is reachable from four terminal n8n branches while `Expand KPI Batch` fans out ~10 parallel branches; the n8n `Apply Document Budget` node reads `item.json.documentsProcessed`, which nothing emits; `lockedAt` is written but never read. → **WO-0009**.
2. **Fallback search unreachable for rejected candidates** — contradicts BRD-0002.R1.AC3. `POST /api/ingestion/observations` 422s on rejection and `onError: continueRegularOutput` routes to `Complete Pipeline Run`, bypassing `Mark Fallback Used`. → **WO-0010**.
3. **URL filtering is a hardcoded allowlist with no config path** — contradicts BRD-0002.R4.AC6/AC7 (drops itu.int, gsma.com, un.org, ecc.gov.et, addisstandard.com; only caller sends `{urls, maxUrls}`). → **WO-0011** (blocked on user policy decision).
4. **Tavily (D-0007) vs "no paid data APIs other than the LLM API"** (BRD-0001.N1.AC1, BRD-0002.N2.AC3) — recorded decision and requirement conflict; user ruling requested. → **WO-0012** note / STATE Blocked.

## Traceability and evidence gaps (repaired)

- BRD-0001.N1 and BRD-0003.N1 appeared in no WO `implements:` and no validation report — the `validated` gates were never met. BRD-0001/0003 rolled back to `approved`; coverage planned in **WO-0012** (D-0017).
- WO-0005's behavioral accessibility criteria were passed on markup inspection; reclassified `blocked` under the typed-evidence rules; WO-0005 back to `done` (VAL-WO-0005 updated; user to arrange tooling or waive).
- BRD-0002 remains `validated`: its reports rest on executed evidence; the regressions above are handled as bug-fix WOs per D-0017.

## Quality residue (tracked)

Unused `external-contracts.ts` (UNIT-0040) vs weaker inline n8n validators (BRD-0002.R8.AC3 enforced by the weak copy); duplicated Prisma query, route pair, and string utils; budget slot consumed before dedup hash; contradictory confidence contracts; hardcoded `DATABASE_URL` fallbacks; non-timing-safe ingestion key compare; four assertion-free tests. → **WO-0013**, **WO-0014**.

## Record repairs applied this audit cycle

VAL-WO-0002 (D-0016 now exists; branch merged), VAL-WO-0006 (branch landed), WO-0005/WO-0008 index citations, WO-0005 `depends-on` +WO-0008, SETUP.md done-gate (inapplicable branch deleted), UNIT-0039 refiled under Services (kind: service).

## Structural sweep

- All WO/BRD/BP/D/VAL/UNIT IDs unique; every `implements:`/`depends-on:`/`blueprint:` target exists; no non-maintenance WO without an approved-or-later BRD.
- Frontmatter statuses agree with STATE.md/ARCHIVE.md index lines (verified post-repair).
- All 40 REGISTRY.md paths resolve to existing files.
- History note: merge commit `6a43236` (WO-0006) deviates from the linear-history convention. It stays — history is not rewritten (D-0017).
