---
id: D-0020
date: 2026-08-05
kind: decision
status: active
relates-to: [BRD-0001, BRD-0002, D-0007, WO-0012]
supersedes:
superseded-by:
---

# D-0020: Fallback search provider is an allowed NFR exception

**Question:** BRD-0001.N1.AC1 and BRD-0002.N2.AC3 forbid "paid data APIs other than the LLM API," but D-0007 chose Tavily as the fallback search provider. Revise the BRDs or revisit D-0007?

**Decision:** Revise both ACs to permit the configured fallback search-provider API alongside the LLM API. BRD-0001.N1.AC1 and BRD-0002.N2.AC3 are amended accordingly (revision approved under user delegation; BRD-0002 remains `validated` — the amendment widens, not narrows, what its validated evidence had to show).

**Why:** Fallback AI-generated web search is a hard requirement (BRD-0002.R1.AC3, R3); a search API is the minimal infrastructure that satisfies it, and D-0007 already committed to Tavily behind a provider abstraction. The NFRs' intent — no heavy data infrastructure (warehouses, vector DBs, distributed processing) — is untouched. Removing Tavily would gut a validated feature to satisfy a clause written against a different class of dependency.

**Rejected alternatives:** revisiting D-0007 / dropping the search provider (breaks required fallback search); leaving the contradiction in place (permanently blocks BRD-0001.N1 validation).

*Decided by the agent under user delegation ("you can decide what's best", 2026-08-05).*
