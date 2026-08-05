---
id: UNIT-0023
name: API handler helpers
kind: service
path: src/server/api/handlers.ts
status: active
---

# UNIT-0023: API handler helpers

**Purpose:** Shared helpers for repeated role-protected API response patterns.

**Interface:** `jsonListWithRole(requirement, key, loadItems)`.

**Variants/options:** Uses the same uppercase `UserRole` requirement vocabulary as UNIT-0015.
