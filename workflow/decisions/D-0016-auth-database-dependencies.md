---
id: D-0016
date: 2026-08-05
kind: decision
status: active
relates-to: [WO-0002, BRD-0003]
supersedes:
superseded-by:
---

# D-0016: Auth and database dependencies

**Question:** Which concrete auth and database dependencies should implement WO-0002 without reintroducing the vulnerable Auth.js beta path deferred in WO-0001?

**Decision:** Use stable `next-auth@4.24.15` with `@next-auth/prisma-adapter@1.0.7`, Prisma 7 with `@prisma/client`, `prisma`, `@prisma/adapter-pg`, and `pg`.

**Why:** The stable NextAuth v4 path provides credential login, JWT sessions, Prisma adapter support, and middleware protection without the vulnerable beta dependency path. Prisma 7 is retained with the PostgreSQL adapter because the latest Prisma CLI audit is clean and supports the selected PostgreSQL stack.
