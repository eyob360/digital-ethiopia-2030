# Project State

Index only — one line per item. Details and status live in each item's frontmatter. Keep every line current. When a BRD is fully validated, move its lines (and its blueprints/work orders) to `ARCHIVE.md` — this file holds active work only.

Last drift audit: ff0db3e (2026-08-05, DRIFT-0002)

## Setup

## BRDs

- [BRD-0001](brds/BRD-0001-kpi-definition-and-pipeline-control.md) — KPI definition and pipeline control — status: approved
- [BRD-0003](brds/BRD-0003-dashboard-api-and-visualization.md) — Dashboard API and visualization — status: approved

## Blueprints

- [BP-0001](blueprints/BP-0001-mvp-architecture-and-build-plan.md) — MVP architecture and build plan (BRD-0001, BRD-0002, BRD-0003) — status: approved

## Work Orders

- [WO-0002](work-orders/WO-0002-data-auth-foundation.md) — Data and auth foundation (BRD-0001, BRD-0003, BP-0001) — status: validated
- [WO-0003](work-orders/WO-0003-deterministic-pipeline-rules.md) — Deterministic pipeline rules (BRD-0001, BRD-0002, BP-0001) — status: validated
- [WO-0004](work-orders/WO-0004-dashboard-api.md) — Dashboard and admin APIs (BRD-0001, BRD-0002, BRD-0003, BP-0001) — status: validated
- [WO-0005](work-orders/WO-0005-dashboard-ui.md) — Dashboard UI (BRD-0001, BRD-0003, BP-0001) — status: done
- [WO-0009](work-orders/WO-0009-pipeline-lock-and-budget-fix.md) — Pipeline lock lifecycle and document budget fix (BRD-0001, BRD-0002, BP-0001) — status: draft
- [WO-0010](work-orders/WO-0010-fallback-search-reachability-fix.md) — Fallback search reachability for rejected observations (BRD-0002, BP-0001) — status: draft
- [WO-0011](work-orders/WO-0011-configurable-url-filtering.md) — Operator-configurable URL filtering (BRD-0002, BP-0001) — status: draft
- [WO-0012](work-orders/WO-0012-nfr-coverage-simplicity-and-separation.md) — NFR coverage: operational simplicity and separation of concerns (BRD-0001, BRD-0003, BP-0001) — status: draft
- [WO-0013](work-orders/WO-0013-validation-unification-and-dedup.md) — Validation-source unification and duplication cleanup (maintenance) — status: draft
- [WO-0014](work-orders/WO-0014-config-hardening-and-test-hygiene.md) — Config fail-loud, timing-safe key compare, and test hygiene (maintenance) — status: draft

## Blocked / Needs user input

- WO-0005 — behavioral accessibility checks (keyboard access, visible focus, contrast; D-0013) are `blocked`: browser tooling unavailable in implementation and validation sessions. User to arrange tooling for a re-validation or waive the behavioral checks (see VAL-WO-0005).
- WO-0011 — waiting on user decisions: URL filtering policy shape (allowlist vs blocklist vs hybrid, refining D-0008) and config surface (DB/admin vs env).
- WO-0012 — needs a user ruling on Tavily (D-0007) vs the "no paid data APIs other than the LLM API" clause in BRD-0001.N1.AC1 / BRD-0002.N2.AC3 before validation can pass N1.
