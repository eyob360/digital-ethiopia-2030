---
id: UNIT-0009
name: Auth middleware
kind: endpoint
path: src/proxy.ts
status: active
---

# UNIT-0009: Auth middleware

**Purpose:** Requires authentication before serving application routes and protected API routes.

**Interface:** Next.js proxy matcher for all routes except `/api/auth`, framework assets, images, and favicon.

**Variants/options:** Uses the built-in NextAuth middleware behavior.
