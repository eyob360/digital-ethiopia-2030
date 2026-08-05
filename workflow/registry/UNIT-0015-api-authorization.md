---
id: UNIT-0015
name: API authorization
kind: service
path: src/server/api/authz.ts
status: active
---

# UNIT-0015: API authorization

**Purpose:** Shared role gate for server API handlers.

**Interface:** `authorizeRole(role, requirement)` and `requireApiRole(requirement)`.

**Variants/options:** Requirements are `viewer` for read access and `operator` for admin/pipeline control access.
