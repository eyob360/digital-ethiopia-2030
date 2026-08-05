---
id: WO-0011
title: Operator-configurable URL filtering
implements: [BRD-0002.R4]
blueprint: BP-0001
depends-on: none
units-touched: []
status: ready
---

# WO-0011: Operator-configurable URL filtering

**Policy decided in [D-0019](../decisions/D-0019-url-filtering-policy-and-config.md):** blocklist-with-default-allow; operator-maintained blocked/allowed override lists (allow wins) stored in the database, editable from the admin UI.

## Summary
`src/lib/pipeline/url-filter.ts` (UNIT-0011) enforces a hardcoded ~11-domain allowlist: any host not matching the built-in `allowedDomains` default is dropped (`url-filter.ts:70`), which rejects legitimate sources such as itu.int, gsma.com, un.org, ecc.gov.et, and addisstandard.com. The function accepts an `allowedDomains` config parameter, but the only caller (`src/app/api/ingestion/url-filter/route.ts`) sends `{urls, maxUrls}` — no config path exists, so BRD-0002.R4.AC7's "operators can configure blocked and allowed domains without code changes" is false, and AC6's "allow … by default" categories are only partially representable as a fixed domain list. Build a real operator-facing config surface per the user's policy decision.

## In scope
- Per D-0019: replace the hardcoded allowlist with blocklist-with-default-allow — default blocked patterns covering AC5's categories; all other domains pass.
- DB-backed config wired end-to-end (Prisma migration for the setting, filter reads it at run time via the ingestion API caller): operator-maintained blocked-domain and allowed-domain override lists, allow winning over block; no code change or redeploy needed to alter them.
- Admin UI surface (operator role) for editing both lists — registry search first (extend the existing admin workspace before creating new components).
- Tests covering default blocking, default allowing, and operator overrides in both directions.

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
- Cite D-0008 (category-level filtering intent) and D-0019 (mechanism: blocklist-with-default-allow, DB + admin UI) — D-0019 refines D-0008.
- Touch points: UNIT-0011 (url-filter), UNIT-0038 (ingestion API caller); if DB-backed, schema changes go through a Prisma migration and likely an admin UI element (registry search first).

## Testing plan
- `npm run lint`, `npm test`, `npm run build` (testing policy in `../brds/OVERVIEW.md`).
- Unit tests: default policy blocks AC5 categories and passes AC6 example domains (itu.int, gsma.com, un.org, ecc.gov.et, addisstandard.com); operator-configured additions/removals take effect without code changes.
- Live check (validation): change the configuration through the operator surface and observe the filter behavior change without redeploying code.
