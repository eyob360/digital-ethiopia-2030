# Module: design-tokens

For UI-heavy projects. Goal: agents pick visual values from a small named set instead of free-typing hex codes and pixel counts — consistency and theme-ability without heavyweight design ops.

## Required when opted in

- A **small semantic token set** (~30 values): colors (brand, neutrals, semantic status), spacing scale, type scale, radius. Usually this just *is* the Tailwind/theme config — declare its file path in `AGENTS.md` Commands & stack.
- Add to **Forbidden patterns** in `AGENTS.md`: hardcoded colors, spacing, and font sizes — always use tokens.
- New tokens need the same treatment as new dependencies: ask the user first.

## Deliberately optional

Tier hierarchies (primitive → semantic → component), Figma sync, token build pipelines, motion/z-index/elevation scales. Experience says these only pay off at design-team scale; premature adoption causes drift and rework. Add them only when the user asks.
