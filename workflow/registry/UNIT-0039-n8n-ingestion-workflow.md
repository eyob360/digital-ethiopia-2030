---
id: UNIT-0039
name: n8n ingestion workflow
kind: service
path: n8n/workflows/digital-ethiopia-ingestion.json
status: active
---

# UNIT-0039: n8n ingestion workflow

**Purpose:** Scheduled n8n orchestration for KPI ingestion, priority URLs, Tavily fallback, OpenAI gates/extraction, retries, and observation storage.

**Interface:** Importable n8n workflow export plus operational notes in `n8n/README.md`.

**Variants/options:** Runs hourly and uses app ingestion API boundaries for deterministic rules and database-backed operations. KPI branches carry `runId`/`branchKey` from start through terminal completion; workflow Code nodes rehydrate branch context after HTTP Request nodes that replace item JSON. Document budget enforcement is delegated to the raw-document endpoint's database counter. The `Validate Relevance JSON` / `Validate Extraction JSON` / `Validate Query JSON` Code nodes contain no hand-maintained validator logic: their `jsCode` is generated from UNIT-0040 by `src/lib/n8n/validator-codegen.mjs` (`npm run n8n:generate`), and `src/lib/n8n/workflow-export.test.ts` pins the committed JSON to the generator output byte-for-byte (WO-0013).
