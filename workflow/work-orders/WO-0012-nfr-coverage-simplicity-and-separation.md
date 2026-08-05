---
id: WO-0012
title: NFR coverage — operational simplicity and separation of concerns
implements: [BRD-0001.N1, BRD-0003.N1]
blueprint: BP-0001
depends-on: none
units-touched: []
status: draft
---

# WO-0012: NFR coverage — operational simplicity and separation of concerns

## Summary
BRD-0001.N1 and BRD-0003.N1 were never covered by any work order or validation report — the traceability gap that broke both BRDs' `validated` gates (D-0017). This WO makes both NFRs implemented and validatable: add executable guards where possible (a dependency-manifest test asserting no distributed-processing, vector-DB, or warehouse packages) and documented inspection evidence where the claim is structural (heavy ingestion/transformation logic lives in `src/server`/`src/lib/pipeline`/n8n, not in dashboard components). After this WO is `done` and the fix WOs land, BRD-0001 and BRD-0003 can progress to `implemented`.

## In scope
- A test that fails if `package.json` gains dependencies in forbidden categories (vector DBs, distributed processing frameworks, warehouse clients) — executable evidence for N1.AC1.
- Inspection evidence, written into this WO on completion, that dashboard pages/components contain no confidence thresholding, normalization, or latest-observation selection (BRD-0003.N1.AC1 / BRD-0003.R1.AC4 boundary) — e.g. the existing server services are the only implementors.
- Resolve with the user: **Tavily (D-0007) vs the "no paid data APIs other than the LLM API" clause** in BRD-0001.N1.AC1 (and BRD-0002.N2.AC3). Either the BRDs get a user-approved revision naming the search provider as an allowed exception, or D-0007 is revisited. Do not self-resolve — this is a recorded-decision-vs-requirement conflict (AGENTS.md rule 5).

## Out of scope
- Any behavior changes to pipeline or dashboard code (fix WOs cover those).

## Requirements

### BRD-0001.N1: Operational simplicity
- AC1: When running the MVP pipeline, the system shall avoid distributed processing, vector databases, data warehouses, and paid data APIs other than the LLM API.

### BRD-0003.N1: Separation of concerns
- AC1: When dashboard pages render KPI data, heavy ingestion and transformation logic shall remain in the backend or pipeline layer.

## Implementation notes
- Under the validation rules, "avoid X" and "logic stays in backend" are structural claims — validation may pass them by inspection, but the dependency-guard test gives N1 durable executed evidence cheaply.
- Touch points: test files only, plus possibly a BRD revision (user-approved) for the Tavily question.

## Testing plan
- `npm run lint`, `npm test` (testing policy in `../brds/OVERVIEW.md`).
- The new dependency-guard test passes on the current tree and demonstrably fails when a forbidden package name is injected into its input.
