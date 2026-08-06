---
id: UNIT-0040
name: External contract validators
kind: validator
path: src/lib/integration/external-contracts.ts
status: active
---

# UNIT-0040: External contract validators

**Purpose:** Single validation source for external AI/search contracts (WO-0013). Production callers: the Tavily search provider (UNIT-0037) validates responses and query inputs with it, the confidence gate (UNIT-0014) delegates its range check to it, and the n8n workflow's validator Code nodes (UNIT-0039) embed code generated from it.

**Interface:** `parseOpenAiQueryGeneration`, `parseOpenAiRelevance`, `parseOpenAiExtraction`, `parseTavilySearchResponse`, and `parseConfidence`.

**Variants/options:** Returns `null` for malformed responses so contract tests can cover invalid external payloads without live credentials. `parseConfidence` accepts only finite numbers on the documented 0-1 scale — out-of-range values are rejected, never rescaled. Keep this module free of imports other than UNIT-0045: it is transpiled and embedded into n8n Code-node source by `src/lib/n8n/validator-codegen.mjs`.
