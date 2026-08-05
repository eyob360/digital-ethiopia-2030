# Registry — Instructions

A catalogue of the system's **intentionally reusable units**: components, hooks, utilities, services, validators, API clients, endpoints. It answers "does this already exist?" — the flow docs answer "why was it built." Register what's meant to be reused; a registry of every file is a second, worse file listing.

## Search before create

Before creating any reusable unit, search `REGISTRY.md` (and grep the codebase). A failed grep is **not** proof something doesn't exist — the code may use a different name. Scan REGISTRY.md's purpose lines, try synonyms in code, and when still unsure, ask the user rather than assuming absence. Then follow, in order:

1. **Reuse** it as-is
2. **Extend** it (prop, variant, parameter)
3. **Compose** existing units
4. **Create new** — last resort; register it here and record which branch you took (and why not 1–3) in the work order

## Process

- On creating a reusable unit: add a `UNIT-NNNN-<slug>.md` entry + index line in `REGISTRY.md`. Name units canonically — `Button`, not `Btn` or `CustomButton`; near-duplicate names breed near-duplicate units.
- On touching one: update its entry if the interface or purpose changed, and list it under `units-touched:` in the work order. (Reverse lookup — which WOs touched a unit — is a grep of `units-touched:`, not a field here.)
- On deleting one: set `status: removed` and delete its index line (keep the file — its history explains old references). The index only ever lists what exists.
- The code is authoritative for interfaces — keep entries minimal so they stay true.
- Existing projects: seed the registry during setup's reverse-engineering pass (see `../SETUP.md`).

## Template

```markdown
---
id: UNIT-0001
name: <name as it appears in code>
kind: component | hook | util | service | validator | api-client | endpoint | page
path: src/...
status: active   # or removed
---

# UNIT-0001: <name>

**Purpose:** what it does, one or two sentences.

**Interface:** props/signature/route — just enough to decide reuse without opening the code.

**Variants/options:** if any.
```
