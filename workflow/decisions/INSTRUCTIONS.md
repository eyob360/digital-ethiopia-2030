# Decisions — Instructions

One file per user decision or answer. Add an index line to `../DECISIONS.md`.

## When to write

Whenever the user resolves a question, makes a choice, or overrides a default — including during setup (conventions, landmines), exploration mode, and any ad-hoc Q&A.

Also record **dead ends** (`kind: dead-end`): approaches tried and abandoned — a library that broke on something, a refactor attempted and reverted. State what was tried, why it failed, and what was done instead. These prevent the most repeated agent failure: confidently re-proposing what already failed.

## When to read

- Before asking the user anything (`../DECISIONS.md` first — never re-ask)
- Before proposing an approach (it may be a recorded dead end)
- When writing a BRD or blueprint (cite relevant decisions)
- When writing a work order (copy relevant decisions into its implementation notes)
- When validating (check the implementation conforms to linked decisions)
- Before changing odd-looking code (it may be a documented landmine)

## Superseding

When a new decision replaces an old one: set the old file's `status: superseded` and `superseded-by: <new ID>`, set `supersedes: <old ID>` on the new one, and move the old index line to the Decisions section of `../ARCHIVE.md`. Never delete — the chain is the history.

## Template

```markdown
---
id: D-0001
date: YYYY-MM-DD
kind: decision   # or dead-end
status: active   # or superseded
relates-to: [BRD-0001, WO-0003]   # optional
supersedes: D-0000   # optional
superseded-by:   # set when superseded
---

# D-0001: <short title>

**Question:** What was unclear or undecided.

**Decision:** What the user chose.

**Why:** Their reasoning, if given.
```
