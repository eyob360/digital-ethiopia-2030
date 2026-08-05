# Module: design-system

For UI-heavy projects; pairs naturally with [design-tokens.md](design-tokens.md). Goal: one coherent component language agents can't fragment.

## Required when opted in

- **One component library, locked** — named in `AGENTS.md` Commands & stack; adding a second needs the dependency gate (it will be rejected: one library per concern).
- **Component states**: every interactive registry unit documents its states (default, hover, focus, disabled, loading, error, empty) in its Variants section; work orders building UI include the applicable states in their ACs or testing plan.
- **Reuse before invention** applies to patterns too: forms, tables, modals, toasts follow the project's existing examples — cite a reference implementation in the work order.

## Deliberately optional

UX-principles docs, information architecture diagrams, microcopy/tone guides, Figma structure mapping. Design-team practices — add only when the user asks.
