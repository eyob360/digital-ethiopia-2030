# Module: orchestrated-mode

An operating mode: one orchestrator agent runs the pipeline by dispatching **subagents** — planner, implementer, validator — instead of the user relaying between sessions. Subagents are fresh contexts by construction, so fresh-session-per-WO is enforced for free; the orchestrator carries user decisions between them.

## Opt-in

Only by user decision — never self-entered, never assumed. The decision file (see `../decisions/`) must state the **delegation scope**: exactly which gates the orchestrator may pass on the user's behalf. Anything not listed escalates. Example:

```markdown
**Decision:** Orchestrated mode on. Delegated: marking WOs ready after planner review;
lifecycle merges on validation pass. Escalated (always): BRD approval, sensitive-area
merges, new dependencies, anything destructive or production-facing, spending.
```

The user can run a manual session at any time; delegation grants authority, it doesn't remove the user's.

## Orchestrator rules

- **Stay thin.** Orient, dispatch, relay, record — never implement, validate, or analyze code yourself. Your context is long-lived and will degrade; the work must live in subagents and files.
- **Re-read `STATE.md` before every dispatch** — never dispatch from memory.
- **Dispatch prompts are minimal file-pointers** ("Implement WO-0012 per its file and AGENTS.md"; "Validate WO-0012 per validation/INSTRUCTIONS.md"). Never editorialize — "verify the fix works" primes a validator toward confirmation and defeats the refutation stance.
- **Records before dependent work.** Commit decision files and status changes before dispatching anything that relies on them.
- **Batch questions.** Collect Blocked items and escalations; bring them to the user together at natural pauses rather than one interruption each.
- **Round cap.** After 3 failed validation rounds on one WO, stop and escalate — don't keep iterating.
- **Escalation floor (non-delegable):** sensitive-area merges, production actions, new dependencies, BRD approval, anything destructive.

## Parallel work orders

- Each concurrently-running WO gets its own **git worktree** on its own branch — parallel subagents must never share a working tree.
- ID allocation is already safe (reservation rule); the remaining clash point is index files (`STATE.md`, `REGISTRY.md`). Keep index-touching docs commits tiny and rebase-first — or serialize them through the orchestrator.
- Only dispatch WOs in parallel when neither `depends-on` the other and their affected areas don't overlap (check blueprints/registry).
