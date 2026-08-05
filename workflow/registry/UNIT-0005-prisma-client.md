---
id: UNIT-0005
name: Prisma client
kind: service
path: src/lib/prisma.ts
status: active
---

# UNIT-0005: Prisma client

**Purpose:** Shared Prisma client instance backed by PostgreSQL for server-side application code.

**Interface:** `prisma`.

**Variants/options:** Reuses a global client during development and defaults to the local Docker PostgreSQL URL when `DATABASE_URL` is unset.
