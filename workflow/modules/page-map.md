# Module: page-map

For web apps. Goal: agents always know what pages exist, who can access them, and never create orphan or duplicate routes — without maintaining a parallel sitemap that drifts.

## Required when opted in

- **The router config is the route SSOT** (`urls.py`, Next.js `app/` tree, …) — named in `AGENTS.md` Commands & stack. Any sitemap view is regenerated from it, never hand-maintained.
- **Significant pages are registry units** (`kind: page`) under the Pages section: purpose, route, and **access roles** in the entry. Register screens users navigate to, not every technical route.
- **Planned-but-unbuilt pages live in BRDs**, not in any map — a map lists what exists.
- New pages follow search-before-create like any unit; the drift audit's path check catches orphaned entries.

## Deliberately optional

Auto-generated navigation, breadcrumb derivation, CI route-sync checks, screen-count progress tracking. Add only when the user asks.
