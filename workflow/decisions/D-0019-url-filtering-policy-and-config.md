---
id: D-0019
date: 2026-08-05
kind: decision
status: active
relates-to: [BRD-0002, WO-0011]
supersedes:
superseded-by:
---

# D-0019: URL filtering policy shape and config surface

**Question:** WO-0011 needs a policy shape (strict allowlist vs blocklist vs hybrid) and a config surface (DB/admin vs env) for URL domain filtering. D-0008 recorded the category-level intent but not the mechanism.

**Decision:** Blocklist-with-default-allow. Default blocked patterns cover BRD-0002.R4.AC5's categories (social/media aggregators, search-result pages, URL shorteners, file-sharing, login-only sites, low-signal forums); every other domain passes by default — which is how AC6's open-ended "official government, regulator, telecom, development-partner, recognized news, statistics" sources get through without enumeration. Operators maintain two override lists — blocked domains and always-allowed domains (allow wins over block) — stored in the database and editable from the admin UI (operator role). Refines D-0008 with the mechanism it assumed.

**Why:** The strict hardcoded allowlist is the current defect — it drops recognized AC6 sources (itu.int, gsma.com, un.org, ecc.gov.et, addisstandard.com). AC6's categories cannot be captured as a finite list; a default-allow with category blocking matches both AC5 and AC6. DB + admin UI satisfies AC7's "without code changes" for the operator persona — no redeploy, no shell access — and the operator UI already exists.

**Rejected alternatives:** strict allowlist (contradicts AC6, source of the bug); env-var config (requires deploy access and restart — not operator-facing).

*Decided by the agent under user delegation ("you can decide what's best", 2026-08-05).*
