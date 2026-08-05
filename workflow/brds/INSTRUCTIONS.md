# BRDs — Instructions

A BRD captures **what the business needs**, parsed from an SRS in `../srs/` (or written from user conversation when no SRS exists). One BRD per feature/module — split when a doc covers unrelated concerns.

## Product overview

`OVERVIEW.md` in this folder is the one product-level doc above all BRDs: business problem, current state, personas, product description, success metrics, and product-wide technical requirements. Written with the user during setup; read it before writing any BRD. Sections:

```markdown
# Product Overview

## Business problem
## Current state
## Personas
## Product description
## Success metrics
## Build order
What must exist before feature work begins (shared kernel: auth, API client, base
components, error handling) and the rough order modules land in.
## Testing policy
Which test levels this project uses (unit / integration / contract / E2E), what must always
be covered (business rules, auth boundaries, error paths), where tests live, where seed/fixture
data lives and how to reset the dev database, and cost tiers:
which checks run while iterating (cheap, targeted), at work-order completion (the full
testing plan), and only at validation/CI (expensive: full builds, E2E, whole suites).
## Technical requirements
Product-level constraints and NFRs that aren't feature-specific. Prompt the user on each:
mandated stack, integrations, performance targets, security/authorization model
(with a role × capability matrix when the product has roles),
accessibility standard, availability, compliance, data retention, localisation,
API design standard (REST/GraphQL conventions, versioning, pagination, error shape).
Also declare the single authoritative schema source (e.g. ORM models, migrations dir)
— derived schema docs are regenerated from it, never hand-maintained — and the data
standards: audit columns, soft-delete vs hard-delete, multi-tenancy (where applicable).
```

## Process

1. Read the SRS. Where it is ambiguous, incomplete, or contradictory, **ask the user** (check `../DECISIONS.md` first) and record answers in `../decisions/`.
2. Write the BRD from the template below. Number requirements sequentially (`BRD-0001.R1`, `BRD-0001.R2`, …; non-functional ones `BRD-0001.N1`, …) and acceptance criteria within them (`BRD-0001.R1.AC1`, …) — these IDs are cited by blueprints, work orders, and validation, so never renumber. In criteria, use **shall** for mandatory, **should** for recommended, **may** for optional; one testable behavior per criterion.
3. Add an index line to `../STATE.md` and get user approval before anything downstream is built on it.

## Baseline BRDs (existing codebase)

When a project has code but no requirement docs, reverse-engineer baseline BRDs:

1. Read the codebase; identify its features/modules.
2. Draft one BRD per feature describing **current behavior** (set `source: codebase`). Where intent is unclear — odd logic, dead-looking code, quirky-but-working fixes — **ask the user, don't guess**; note confirmed no-touch areas ("landmines") in the BRD and in `../decisions/`.
3. Get user approval as usual. New feature work then builds on these baselines.

## Statuses

`draft` → `approved` → `implemented` → `validated`

Optional detour: `draft` → `exploring` → `approved` (see below).

Gate criteria:

- `approved`: user explicitly approved; Open questions empty; every requirement has numbered ACs; `source` cited; no unresolved placeholders ("TBD", "etc.", "as needed")
- `implemented`: every requirement ID — `R*` and `N*` alike — covered by a `done` work order
- `validated`: every requirement ID — `R*` and `N*` alike — validated with a passing report

## Revisions

Any change to an `approved` (or later) BRD requires user re-approval. After approval, review everything citing it — blueprints (see their Revisions rule), work orders, validation reports — and flag what's now stale.

## Exploration mode

For UX-heavy or uncertain features, prototyping is how requirements get discovered. The **user** can set a BRD's status to `exploring` (agents may suggest it when specs feel premature — never enter it yourselves). While a BRD is `exploring`:

- Build and iterate on it directly with the user — no work orders or validation reports per change
- Decisions still get recorded, conventions still apply, questions still get asked

When the user says it's settled: rewrite the BRD's requirements to describe the settled behavior and get approval. Then write one retroactive wrap-up work order covering what the prototype implements, mark it `done`, and validate it normally — this keeps exploration-built features traceable and lets the BRD reach `implemented`/`validated`. Further downstream work (e.g. backend integration) goes through the normal pipeline.

## Template

```markdown
---
id: BRD-0001
title: <feature name>
source: srs/<file>#<section>
status: draft
---

# BRD-0001: <feature name>

## Overview
What problem this solves and for whom.

## Terminology
Terms the team/domain uses, defined once.

## Requirements

### BRD-0001.R1: <requirement title>
As a <role>, I want <capability> so that <benefit>.
<!-- If the feature has statuses, include a transition table: state × action → state, allowed actors. -->


**Acceptance criteria:**
- AC1: When <condition>, the system shall <observable result>.
- AC2: ...


## Non-functional requirements
Optional — feature-specific NFRs (performance, security, accessibility, …), numbered like requirements:

### BRD-0001.N1: <NFR title>
- AC1: When <condition>, the system shall <measurable behavior>.

## Out of scope
Explicitly excluded things, so agents don't build them.

## Open questions
Unresolved items — must be empty before status can be `approved`.
```
