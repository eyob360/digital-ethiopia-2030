---
id: WO-0013
title: Validation-source unification and duplication cleanup
implements: none
blueprint: none
depends-on: [WO-0010]
units-touched:
  [
    UNIT-0014,
    UNIT-0016,
    UNIT-0017,
    UNIT-0023,
    UNIT-0036,
    UNIT-0037,
    UNIT-0038,
    UNIT-0039,
    UNIT-0040,
    UNIT-0045,
  ]
status: validated
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

## Implementation record (2026-08-06)

**Validator unification — approach chosen: generated-code embedding** (`external-contracts.ts` stays canonical; the workflow embeds code generated from it). Rationale: the endpoint-based alternative would replace the three `Validate * JSON` Code nodes with HTTP hops, which (a) rewires the exact node graph, lineage back-references (`contextFrom(...)`), and IF wiring that took VAL-WO-0010 rounds 1–4 to stabilize, (b) adds new body-bearing HTTP nodes into a runtime with four known pre-existing defects (STATE.md blocked item — `$env` denial and jsonBody form would apply to the new nodes too), and (c) cannot be runtime-verified in this environment. Generation keeps the workflow's execution graph byte-identical outside the three `jsCode` strings, keeps validation logic in tested TypeScript, and makes drift impossible:
- `src/lib/n8n/validator-codegen.mjs` transpiles the needed validator functions (plus transitive helpers) from `src/lib/integration/external-contracts.ts` / `src/lib/strings.ts` with the pinned TypeScript compiler and wraps them in the existing context-rehydration glue. `npm run n8n:generate` rewrites only the three `jsCode` strings in the workflow JSON.
- `src/lib/n8n/workflow-export.test.ts` asserts the committed `jsCode` equals the generator output byte-for-byte (no hand-maintained copy can survive), on top of all pre-existing WO-0010 guards (unchanged and passing).
- `src/lib/n8n/validator-codegen.test.ts` executes the generated node code with an n8n-like harness: malformed relevance/extraction/query outputs that the old weak inline checks accepted (confidence 85 or 1.2, empty `region`, non-ISO dates, string `value_numeric`) are now rejected; context rehydration incl. the direct-fallback `contextFrom` path is covered.
- Endpoint side, UNIT-0040 gained production callers: the Tavily provider validates responses with `parseTavilySearchResponse` (malformed rows dropped, not patched) and `parseSearchInput` delegates to `parseOpenAiQueryGeneration`; the confidence gate delegates to `parseConfidence`.
- Rules strictly stronger than before everywhere; the workflow-policy 3–5 query count lives in the generated glue (single-sourced in the codegen module), on top of the contract rules.

**Confidence contract — decision: reject out-of-range at the boundary; no rescaling.** `parseConfidence` (exported from UNIT-0040) is the single range authority: finite numbers on the documented 0–1 scale only. `normalizeConfidence` no longer rescales 1–100 inputs by /100; numeric strings ("0.87") are still coerced, then range-checked. **Behavior change (explicit):** an extraction/relevance confidence like `85` was previously rescaled to `0.85` and could be auto-inserted; it is now rejected — in the workflow at the generated validator (routes to the fallback path like any invalid output), and at `appendAcceptedObservation` for any direct API caller. The OpenAI prompts never documented a 1–100 scale and BRD-0002.R10 thresholds are 0–1, so only undocumented-scale outputs are affected.

**Route pair — both kept, one implementation.** Caller audit: the pipeline UI (`pipeline-controls.tsx`) posts to `/api/pipeline/runs` (session/OPERATOR auth); the n8n workflow posts to `/api/ingestion/pipeline/runs` (API-key auth) — neither is removable. The full action logic moved to `handlePipelineRunAction` (UNIT-0023); both routes are now auth-only wrappers. Side effect: the ingestion route's unsupported-action error message is now the shared "Unsupported pipeline run action" (nothing reads it).

**Other duplication:** `findKpisWithLatestObservation` (UNIT-0016) now backs both `getDashboardKpis` and `loadEligibleKpisForPipeline`; `asNonEmptyString` (5 inline copies) + `parseNonEmptyString` consolidated into `src/lib/strings.ts` (UNIT-0045, new — registry searched first: no existing string util; placed in `src/lib` rather than UNIT-0023 because `external-contracts.ts` must not import server code).

**Budget-before-dedup:** `storeRawDocumentIfNew` now hashes and duplicate-checks before reserving the budget slot; duplicates never consume budget. The slot is still reserved before the insert, preserving WO-0009 fail-closed semantics. Minor consequence: a duplicate arriving after budget exhaustion now reports `duplicate` instead of `budget_exhausted` (same n8n routing either way — `New Document?` only tests for `stored`). `n8n/README.md` cost-controls wording updated.

**Registry branches:** reuse — UNIT-0040 validators, UNIT-0012 hash (unchanged); extend — UNIT-0014, UNIT-0016, UNIT-0023, UNIT-0037, UNIT-0038 (`/search`, `/pipeline/runs`), UNIT-0039, UNIT-0040 (`parseConfidence` export); create — UNIT-0045 (string helpers) and the codegen module (documented under UNIT-0039/0040, not separately registered: single-purpose build tool).

**Testing:** `npm run lint`, `npm test` (24 files / 106 tests), `npm run build` all pass. Out-of-scope items untouched: the four n8n runtime drift items (STATE.md blocked section) are neither fixed nor regressed — the workflow diff is exactly the three generated `jsCode` strings.
