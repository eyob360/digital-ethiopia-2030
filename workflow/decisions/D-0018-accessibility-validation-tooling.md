---
id: D-0018
date: 2026-08-05
kind: decision
status: active
relates-to: [WO-0005, D-0013, D-0017]
supersedes:
superseded-by:
---

# D-0018: Accessibility validation tooling

**Question:** WO-0005's behavioral accessibility criteria (keyboard access, visible focus, contrast — D-0013) are `blocked`: no browser tooling was available, so they were graded on markup inspection. Waive them or arrange tooling?

**Decision:** Arrange tooling in-repo. Add `@playwright/test` and `@axe-core/playwright` as devDependencies. Re-validate WO-0005 in a fresh session with executed evidence: an axe WCAG 2.2 AA scan (covers contrast) plus scripted keyboard-navigation and focus-visibility checks across the MVP pages. These checks run at the validation/CI cost tier, not while iterating.

**Why:** Waiving would repeat the inspection-graded-evidence failure that triggered the rework (D-0017). D-0013 targets WCAG 2.2 AA — a measurable standard deserving executable evidence. Playwright is the stack-standard browser harness for Next.js.

**Rejected alternatives:** waiver (weakens D-0013 permanently); manual-only browser checks (not reproducible, and interactive tooling remains unavailable in agent sessions); external audit service (cost, evidence lives outside the repo).

*Decided by the agent under user delegation ("you can decide what's best", 2026-08-05).*
