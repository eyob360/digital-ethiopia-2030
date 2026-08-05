---
id: WO-0013
title: Validation-source unification and duplication cleanup
implements: none
blueprint: none
depends-on: [WO-0010]
units-touched: []
status: ready
---

# WO-0013: Validation-source unification and duplication cleanup

## Summary
Maintenance (no new business requirement — quality residue from the MVP build, per D-0017): consolidate duplicated logic so each concern has one source of truth. The largest item: `src/lib/integration/external-contracts.ts` (UNIT-0040) has **zero production callers**, while the n8n workflow re-implements its validators inline with *weaker* rules — so BRD-0002.R8.AC3's strict-JSON rejection is currently enforced only by the weak copy. Unify to one validation source. Also removes byte-level duplication and reconciles two contradictory confidence contracts.

## In scope
- **Validator unification:** one validation source for external AI/search contracts. Either the n8n nodes call an ingestion endpoint that uses `external-contracts.ts`, or the export embeds generated code from it — no hand-maintained inline copy. The unified rules must be at least as strict as `external-contracts.ts` (strengthens BRD-0002.R8.AC3 enforcement; that AC stays owned by BRD-0002's validation).
- **Confidence contract:** `normalizeConfidence` (`src/lib/pipeline/confidence.ts:25`) rescales 1–100 inputs by /100, while `parseOpenAiRelevance` (`external-contracts.ts:39`) rejects values >1. Pick one contract (recommend: reject out-of-range at the boundary, normalize only documented scales) and apply it in both places — which the unification above collapses into one place.
- **Duplication:** byte-identical Prisma query in `getDashboardKpis` (`src/server/dashboard.ts`) vs `loadEligibleKpisForPipeline` (`src/server/kpis.ts`) — extract one shared query; identical route pair `api/pipeline/runs` vs `api/ingestion/pipeline/runs` — one implementation, one delegating (or one removed if a caller audit allows); `asNonEmptyString` copy-pasted 3× plus `parseNonEmptyString` — one util, registered.
- **Budget-before-dedup:** `src/server/raw-documents.ts` reserves the budget slot (`raw-documents.ts:29`) before computing the dedup hash (`raw-documents.ts:38`) — duplicates burn budget. Hash and check for duplicates first; reserve the slot only for genuinely new documents (preserve fail-closed semantics from WO-0009).
- Registry updates: UNIT-0040 becomes the single validation source (or is removed with `status: removed` if the unification lands elsewhere); new shared query/util units registered.

## Out of scope
- Lock/completion semantics (WO-0009), fallback routing (WO-0010), URL filter policy (WO-0011).
- Test-hygiene and env/key hardening items (WO-0014).

## Requirements
None (maintenance). Related ACs for context, not coverage: BRD-0002.R8.AC3 (strict-JSON rejection — enforcement strengthened), BRD-0002.N2.AC1 (budget — no longer burned by duplicates).

## Implementation notes
- Depends on WO-0010 because both rewire the n8n workflow's validation/routing nodes — run sequentially, fresh session each.
- Search the registry before extracting shared units (UNIT-0016/0017 own the KPI/dashboard queries; UNIT-0023 owns API handler helpers — the string utils may belong there).

## Testing plan
- `npm run lint`, `npm test`, `npm run build` (testing policy in `../brds/OVERVIEW.md`).
- Unification proof: a test feeding the same malformed AI output through the single validation path rejects it under the strict rules; grep/export-test evidence that no inline duplicate validator remains in the workflow JSON.
- Duplicate-document test: storing identical content twice consumes exactly one budget slot.
- Confidence contract: boundary tests for 0–1 and out-of-range inputs under the chosen contract.
