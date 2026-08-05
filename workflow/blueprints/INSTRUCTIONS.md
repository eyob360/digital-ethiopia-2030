# Blueprints — Instructions

A blueprint captures **how to build** one or more approved BRDs: the few key architectural decisions an agent shouldn't make alone. It stays high-level — boundaries and choices, not implementation detail.

Skip a blueprint when the feature is simple and the existing architecture makes the path obvious; work orders may then cite the BRD directly.

## Process

1. Read the BRD(s) and the existing codebase. Ask the user about genuine forks in the road (check `../DECISIONS.md` first).
2. Write the blueprint from the template below. Use mermaid diagrams where a picture is clearer than prose.
3. Add an index line to `../STATE.md` and get user approval.

## Statuses

`draft` → `approved`

Gate criteria for `approved`: user explicitly approved; every BRD it implements is `approved`; each key decision lists alternatives and why; affected areas listed.

## Prototype-first flow (opt-in)

A frontend-only prototype before backend work is a user choice, normally made during setup (see `../SETUP.md`) and recorded in `../decisions/`; it can also be chosen later for a specific feature set. Never assume it.

If chosen, write a minimal blueprint **before prototyping starts** that fixes one boundary: all data access goes through a swappable mock layer (mock API client / fixtures shaped like the intended contract) — never hardcoded in components. Backend integration then means implementing the real contract and swapping the layer, via normal work orders; the prototype is never a throwaway. Flow: draft BRDs (`exploring`) → minimal blueprint → prototype freely → settle & wrap-up WO → backend WOs per feature.

## Revisions

If a BRD a blueprint implements changes after approval, set the blueprint back to `draft`, update it to match, and get it re-approved before any new work orders cite it.

## Template

```markdown
---
id: BP-0001
title: <plan name>
implements: [BRD-0001]
status: draft
---

# BP-0001: <plan name>

## Approach
The overall shape of the solution, in a few paragraphs and/or a mermaid diagram.

## Key decisions
For each: the decision, alternatives rejected, and why. Link `../decisions/` files where the user decided.

## Boundaries & landmines
Existing code the implementation must not touch or must treat carefully, and why.

## Affected areas
Modules/files/models this will create or change.

## Build order
Optional — what lands first within this plan, and what must exist beforehand (cite `../brds/OVERVIEW.md` build order).
```
