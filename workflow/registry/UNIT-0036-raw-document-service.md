---
id: UNIT-0036
name: Raw document service
kind: service
path: src/server/raw-documents.ts
status: active
---

# UNIT-0036: Raw document service

**Purpose:** Stores fetched raw document text only when its SHA256 content hash is new.

**Interface:** `parseRawDocumentInput(input)`, `storeRawDocumentIfNew(input, client)`, and `serializeRawDocument(rawDocument)`.

**Variants/options:** Returns `stored` for new content and `duplicate` for existing content.
