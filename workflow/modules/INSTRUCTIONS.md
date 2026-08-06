# Modules — Instructions

Optional practice packs beyond the core pipeline. A project opts in by listing them in `SETUP.md`'s `modules:` frontmatter (a user decision, made at setup or later — record it in `../decisions/`). One file per module here defines what opting in requires. If a listed module has no file here, ask the user what it means and write the file.

Available:

- [design-tokens.md](design-tokens.md) — semantic design tokens for UI-heavy projects
- [design-system.md](design-system.md) — locked component library + state coverage for UI-heavy projects
- [page-map.md](page-map.md) — route SSOT + pages-as-registry-units for web apps
- [orchestrated-mode.md](orchestrated-mode.md) — orchestrator + subagents run the pipeline under a user-granted delegation scope
