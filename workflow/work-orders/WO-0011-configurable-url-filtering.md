---
id: WO-0011
title: Operator-configurable URL filtering
implements: [BRD-0002.R4]
blueprint: BP-0001
depends-on: none
units-touched: []
status: draft
---

# WO-0011: Operator-configurable URL filtering

**Blocked — needs user decisions before `ready`:** (1) policy shape: strict allowlist, blocklist-with-default-allow, or hybrid (D-0008 describes category-level intent but not the mechanism); (2) config surface: DB-backed admin setting vs environment variable. See STATE.md Blocked.

## Summary
`src/lib/pipeline/url-filter.ts` (UNIT-0011) enforces a hardcoded ~11-domain allowlist: any host not matching the built-in `allowedDomains` default is dropped (`url-filter.ts:70`), which rejects legitimate sources such as itu.int, gsma.com, un.org, ecc.gov.et, and addisstandard.com. The function accepts an `allowedDomains` config parameter, but the only caller (`src/app/api/ingestion/url-filter/route.ts`) sends `{urls, maxUrls}` — no config path exists, so BRD-0002.R4.AC7's "operators can configure blocked and allowed domains without code changes" is false, and AC6's "allow … by default" categories are only partially representable as a fixed domain list. Build a real operator-facing config surface per the user's policy decision.

## In scope
- The config surface chosen by the user (DB/admin or env), wired end-to-end: filter reads operator-configured blocked/allowed domains; no code change needed to alter them.
- Default policy per the user's allowlist/blocklist decision, keeping AC5's blocked categories enforced by default.
- Tests covering configured-domain overrides and defaults.

## Out of scope
- Changing the ≤5-URL caps (AC1/AC4) or dedup (AC2).
- Search-provider changes (D-0007 stands).

## Requirements

### BRD-0002.R4: Web search and URL controls
- AC3: When candidate URLs are gathered, the system shall remove invalid domains according to configured filtering rules.
- AC5: When filtering candidate URLs, the system shall block social/media aggregators, search-result pages, URL shorteners, file-sharing pages, login-only sites, and low-signal forums by default.
- AC6: When filtering candidate URLs, the system shall allow official government, regulator, telecom, development-partner, recognized news, and statistics sources by default. **(Currently violated: the hardcoded allowlist drops recognized sources in those categories.)**
- AC7: When default filtering rules are insufficient, the system shall allow operators to configure blocked and allowed domains without code changes. **(Currently violated: no config path exists.)**

## Implementation notes
- Cite D-0008 (configurable domain filtering policy) — this WO implements the mechanism D-0008 assumed; the user's new policy decision should be recorded as a decision that refines or supersedes D-0008.
- Touch points: UNIT-0011 (url-filter), UNIT-0038 (ingestion API caller); if DB-backed, schema changes go through a Prisma migration and likely an admin UI element (registry search first).

## Testing plan
- `npm run lint`, `npm test`, `npm run build` (testing policy in `../brds/OVERVIEW.md`).
- Unit tests: default policy blocks AC5 categories and passes AC6 example domains (itu.int, gsma.com, un.org, ecc.gov.et, addisstandard.com); operator-configured additions/removals take effect without code changes.
- Live check (validation): change the configuration through the operator surface and observe the filter behavior change without redeploying code.
