---
id: UNIT-0045
name: String helpers
kind: util
path: src/lib/strings.ts
status: active
---

# UNIT-0045: String helpers

**Purpose:** Shared string parsing helpers used by input validators across server services, API routes, and the external-contract validators (previously five inline copies, consolidated by WO-0013).

**Interface:** `asNonEmptyString(value)` — returns the trimmed string for non-empty string input, otherwise `null`.

**Variants/options:** None. Keep this module dependency-free: it is embedded into generated n8n Code-node source by `src/lib/n8n/validator-codegen.mjs`.
