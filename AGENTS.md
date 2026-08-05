# Agent Instructions

This project follows a file-based AI development workflow. Orient in two steps: read this page (rules, map, commands), then `workflow/STATE.md` (where the project currently stands).

## Map

```text
workflow/
  STATE.md        ← pipeline status index (active work) — read before any work
  ARCHIVE.md      ← index of completed/validated work
  SETUP.md        ← one-time project setup checklist; kept as a record after
  DECISIONS.md    ← index of user decisions — check before asking anything
  decisions/      ← one file per decision
  srs/            ← original requirement docs, as delivered. Never edit.
  brds/           ← business requirements parsed from the SRS, traceable IDs
                    (incl. OVERVIEW.md — product-level context; read before BRD work)
  blueprints/     ← technical plans for BRDs. Optional for simple features.
  work-orders/    ← self-contained implementation tickets
  validation/     ← verification that work orders satisfy requirements
  registry/       ← catalogue of reusable units — search before creating anything
  modules/        ← opt-in practice packs; active ones listed in SETUP.md frontmatter
```

Each folder has an `INSTRUCTIONS.md` with its rules and document template. Read it before creating or editing anything in that folder.

**Reading priority when context is tight:** mandatory = this file, `STATE.md`, and the item you're working on (work orders are self-contained precisely so this is safe). Everything else loads on demand.

## Pipeline

```text
SRS → BRDs → Blueprints → Work Orders → Implementation → Validation
```

Implement only from work orders, never from BRDs directly. Exception: BRDs the user has set to `exploring` (see exploration mode in `workflow/brds/INSTRUCTIONS.md`).

## What to do next

**The user's request always comes first.** If they asked for something specific, do that. When you're idle or asked "what's next", don't pick for yourself: check file state against the list below, then present the applicable options to the user — highest priority first, with a short recommendation — and let them choose.

1. `SETUP.md` has status `in-progress` → offer to work through its checklist.
2. `srs/` has documents not yet parsed into BRDs → offer to parse them (`brds/INSTRUCTIONS.md`).
3. A `blocked` item in STATE.md can be unblocked → surface it.
4. An approved BRD has requirements with no work orders → offer to plan them (blueprint first if warranted).
5. A `ready` work order exists → offer to implement it; prefer ones that others `depend-on`, and respect the build order in `workflow/brds/OVERVIEW.md`.
6. A `done` work order exists → offer to validate it (`validation/INSTRUCTIONS.md`).
7. The `Last drift audit` in STATE.md is stale (~20+ commits behind HEAD, or none recorded and the codebase is non-trivial) → offer a drift audit.

## Communication

Keep responses short and simple — the user should be able to read, understand, and reply quickly. Lead with the point. One question at a time — batch only when questions are tightly related and answering them together is less work for the user. No recaps of what the user already knows.

## Core rules

1. **Orient first.** Read `workflow/STATE.md` before starting any work.
2. **Ask, don't assume.** If requirements, context, or a decision are missing or ambiguous, ask the user. Record every answer in `workflow/decisions/` and index it in `workflow/DECISIONS.md`. Check existing decisions first — never re-ask, and check before proposing an approach (it may be a recorded dead end).
3. **Index files hold one line per item, never content.** Details live in the item's own file (status in its frontmatter), named `<ID>-<short-kebab-slug>.md` (e.g. `BRD-0001-partner-allocation.md`). After any change to an item, update its frontmatter and its index line. If they ever disagree, neither wins by default — reconcile from evidence (validation reports, code, git history, decisions) and repair both; ask the user if still ambiguous.
4. **Follow the pipeline — proportionally.** Feature-level work needs a work order, and work orders need an approved BRD (and blueprint, where one exists; maintenance work orders are the exception — see `workflow/work-orders/INSTRUCTIONS.md`). Trivial changes — typos, obvious bugs, refactors that don't alter behavior described in a BRD — can be done directly; note them in `workflow/STATE.md` only if they touch tracked work. When unsure whether something is feature-level, ask. BRDs in `exploring` status are exempt (see `workflow/brds/INSTRUCTIONS.md`).
5. **Flag drift.** If code contradicts a BRD or blueprint, don't silently fix either side — ask the user which is the source of truth.
6. **Respect landmines.** Quirky-but-working code may be load-bearing. Before "cleaning up" anything odd, check `workflow/DECISIONS.md` and the relevant BRD/blueprint; if undocumented, ask the user and record the answer.
7. **Search before create.** Before writing any reusable unit (component, hook, util, service, endpoint), search `workflow/registry/REGISTRY.md`: reuse → extend → compose → create new (register it). Record the branch taken in the work order.
8. **Validate before closing.** A work order is done only when the checks in `workflow/validation/INSTRUCTIONS.md` pass.

## Commands & stack

<!-- Fill in per project. Agents: if this section is empty, ask the user to fill it. -->

- Stack:
- Dev server:
- Full dev stack: <!-- single entry-point script, e.g. ./start_dev_servers.sh — bring up everything (infra, backends, frontends) with one command; comment it well: it doubles as the architecture map (services, ports, startup order) -->
- Tests:
- Lint / format:
- Dev data: <!-- where fixtures/seeds live, how to reset the dev database -->

## Conventions

<!-- Per project: adjust to taste. Sensible defaults below. -->

- Branching: feature branches off `main`; never commit directly to `main`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Reference the work order ID in the message (e.g. `feat: add batch export [WO-0003]`).
- PRs: one work order per PR where practical; PR description links the work order.
- Never force-push, drop schemas, or run destructive commands without explicit user approval.
- Secrets never go in code or commits — use `.env`/vault; never commit keys.
- New dependencies need user approval first; record the choice (and rejected alternatives) in `workflow/decisions/`. Before proposing one: check the existing tree and stdlib — one library per concern, never a second for the same job.
- Forbidden patterns: <!-- per project, e.g. inline styles, magic numbers, direct DB calls from UI -->
- Code touching security, auth, payments, or core business rules gets user review before merge, even when validation passes.
