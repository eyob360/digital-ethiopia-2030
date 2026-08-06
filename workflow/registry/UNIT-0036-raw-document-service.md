---
id: UNIT-0036
name: Raw document service
kind: service
path: src/server/raw-documents.ts
status: active
---

# UNIT-0036: Raw document service

**Purpose:** Stores fetched raw document text only when its SHA256 content hash is new; a pipeline document budget slot is reserved only for genuinely new documents (hash and duplicate check run first, WO-0013), and always before the insert (fail-closed, WO-0009).

**Interface:** `parseRawDocumentInput(input)`, `storeRawDocumentIfNew(input, client)`, and `serializeRawDocument(rawDocument)`.

**Variants/options:** Returns `stored` for new content, `duplicate` for existing content (never consumes budget), and `budget_exhausted` when the active pipeline run has already stored 10 new documents. For n8n ingestion payloads, it echoes workflow context fields such as `runId`, `branchKey`, and `kpi` so downstream branch completion can use the authoritative run metadata.
