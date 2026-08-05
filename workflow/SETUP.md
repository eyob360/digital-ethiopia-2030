---
status: in-progress
type: web-app    # web-app | cli | data-pipeline | mobile | library | ... (informational for now)
modules: [design-tokens, design-system, page-map]      # opted-in extras beyond the core pipeline — see modules/INSTRUCTIONS.md
framework-version: 4cf20c0   # optional — commit hash of the framework template this was copied from
---

# Project Setup

Work through these with the user. Delete the branch that doesn't apply. When all items are checked: set status to `done` above and move this file's line in `STATE.md` to `ARCHIVE.md`. Keep this file as a record of how the project was set up.

## All projects

- [x] Ensure the project is a git repo (`git init` + first commit if not) — drift audits and evidence reconciliation depend on it
- [x] Confirm each agent tool in use reads `AGENTS.md`; add symlinks for tools that expect their own filename (`CLAUDE.md` ships pre-linked)
- [x] Fill the profile frontmatter above with the user: project `type`, and which optional `modules` this project opts into (present the options in `modules/INSTRUCTIONS.md`)

- [x] Ask the user which repository layout they want, explaining the options:
  - **Single repo** (default) — all app components together; simplest, full traceability
  - **Workspace root** — for multi-repo setups: this framework lives at a workspace root with each repo as a sibling child directory. Version the root itself as a small git repo (child repos ignored) so the workflow docs get history, and prefer launching agents from the root so the whole ID graph is visible
  Record the choice in `decisions/`.
- [x] Review **Conventions** in `AGENTS.md` with the user; adjust defaults
- [x] Write `brds/OVERVIEW.md` with the user (product-level context; see `brds/INSTRUCTIONS.md`)
- [x] Obtain requirements: ask the user for SRS/requirement document(s) and get them into `srs/` (see "Receiving documents" in `srs/INSTRUCTIONS.md`). If none exists, gather requirements in conversation instead (see `brds/INSTRUCTIONS.md`).
- [x] Parse requirements into BRDs and get them approved

## New project

- [x] Ask the user for the stack and commands; fill in **Commands & stack** in `AGENTS.md`
- [ ] Ask the user which development approach they want, explaining the options:
  - **Spec-first** (default) — requirements approved before implementation
  - **Prototype-first** — frontend-only prototype to discover UX requirements, then backend integration; suits UX-heavy products or unsettled requirements (mechanics in `blueprints/INSTRUCTIONS.md`)
  Record the choice in `decisions/`.

## Existing project

- [ ] Read the codebase; fill in **Commands & stack** in `AGENTS.md`
- [ ] Detect current conventions from the repo (git log, lint configs, structure); **present them to the user** to keep or change — record the outcome in `decisions/`. Never adopt silently: existing practice may be bad practice.
- [ ] Ask the user: any fragile or no-touch areas ("landmines")? Record answers in `decisions/`
- [ ] If the codebase lacks requirement docs, write baseline BRDs from the code (see `brds/INSTRUCTIONS.md`)
- [ ] Seed `registry/` with the main existing reusable units found while reading the codebase (see `registry/INSTRUCTIONS.md`) — main ones only, not exhaustive
