---
id: UNIT-0004
name: Password helpers
kind: util
path: src/lib/auth/password.ts
status: active
---

# UNIT-0004: Password helpers

**Purpose:** Creates and verifies local credential password hashes for seeded and manually created users.

**Interface:** `createPasswordHash(password)` and `verifyPassword(password, storedHash)`.

**Variants/options:** Uses Node `scrypt` hashes in the `scrypt:<salt>:<hex>` format.
