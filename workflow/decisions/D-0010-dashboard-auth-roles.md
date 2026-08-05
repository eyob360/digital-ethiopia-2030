---
id: D-0010
date: 2026-08-05
kind: decision
status: active
relates-to: [BRD-0001, BRD-0003]
supersedes:
superseded-by:
---

# D-0010: Dashboard auth and roles

**Question:** Should the MVP include login/auth, and what roles should exist?

**Decision:** Require login for the MVP and use two roles: `operator` and `viewer`.

**Why:** The user accepted the recommendation. Operators can manage KPI/admin/pipeline controls. Viewers have read-only dashboard access.
