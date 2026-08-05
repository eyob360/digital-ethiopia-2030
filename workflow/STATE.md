# Project State

Index only — one line per item. Details and status live in each item's frontmatter. Keep every line current. When a BRD is fully validated, move its lines (and its blueprints/work orders) to `ARCHIVE.md` — this file holds active work only.

Last drift audit: b379055 (2026-08-05)

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

## Blocked / Needs user input

- WO-0005 — behavioral accessibility checks (keyboard access, visible focus, contrast; D-0013) are `blocked`: browser tooling unavailable in implementation and validation sessions. User to arrange tooling for a re-validation or waive the behavioral checks (see VAL-WO-0005).
