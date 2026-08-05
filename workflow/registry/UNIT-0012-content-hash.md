---
id: UNIT-0012
name: Content hash
kind: util
path: src/lib/pipeline/content-hash.ts
status: active
---

# UNIT-0012: Content hash

**Purpose:** Computes SHA256 hashes for fetched raw text and decides whether a raw document is new.

**Interface:** `createContentHash(rawText)` and `shouldStoreRawDocument(contentHash, existingHashes)`.

**Variants/options:** Whitespace is normalized before hashing.
