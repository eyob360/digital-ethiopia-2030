---
id: D-0017
date: 2026-08-05
kind: decision
status: active
relates-to: [BRD-0001, BRD-0002, BRD-0003, WO-0005, WO-0009, WO-0010, WO-0011, WO-0012, WO-0013, WO-0014]
supersedes:
superseded-by:
---

# D-0017: MVP completion rejected — rework policy

**Question:** The MVP was marked fully validated and archived. The user rejected that completion. How is the rework tracked?

**Decision:**

1. **Rollbacks.** BRD-0001 and BRD-0003 revert to `approved` — their `validated` gates were never met (`BRD-0001.N1` and `BRD-0003.N1` appear in no work order's `implements:` and no validation report). Their work orders (WO-0002–WO-0005) and BP-0001 move back to `STATE.md`. WO-0005 reverts to `done`: its behavioral accessibility criteria were passed on markup inspection, which the evidence rules classify as `blocked` (browser checks never ran).
2. **BRD-0002 stays `validated`.** Functional regressions against its ACs (pipeline lock/budget, fallback reachability, URL-filter configurability) are bugs — code violating existing ACs — and are fixed via work orders citing those requirements (WO-0009, WO-0010, WO-0011) without demoting the BRD. On each fix's validation, the corresponding VAL report rows are re-verified.
3. **NFR coverage.** WO-0012 covers BRD-0001.N1 and BRD-0003.N1 so both BRDs can legitimately reach `implemented`/`validated`.
4. **Quality residue** goes into maintenance WOs (WO-0013, WO-0014), `implements: none`.
5. **Process.** One WO per fresh session; validation follows the refutation stance with typed evidence (behavioral claims need executed evidence); WO-0009 (lock/budget — data integrity) and WO-0014 (ingestion-key comparison — auth) wait for user review before merge. Merged history is not rewritten (merge commit `6a43236` stays).

**Update 2026-08-05:** the user delegated the three open rework decisions and the readiness review of WO-0009–WO-0014 to the agent ("you can decide what's best"). Outcomes recorded in D-0018 (accessibility tooling), D-0019 (URL filtering policy/config), D-0020 (search-provider NFR exception); all six WOs marked `ready`.

**Why:** The completion claim rested on traceability gaps (uncovered NFRs), inspection-graded behavioral criteria, and functional defects found on re-review. Rolling back only what factually failed its gate — rather than everything — keeps validated evidence standing where it is genuinely executed and scopes the rework to real gaps.
