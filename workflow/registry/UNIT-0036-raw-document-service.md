---
id: UNIT-0036
name: Raw document service
kind: service
path: src/server/raw-documents.ts
status: active
---

# UNIT-0036: Raw document service

**Purpose:** Reserves a pipeline document budget slot, then stores fetched raw document text only when its SHA256 content hash is new.

**Interface:** `parseRawDocumentInput(input)`, `storeRawDocumentIfNew(input, client)`, and `serializeRawDocument(rawDocument)`.

**Variants/options:** Returns `stored` for new content, `duplicate` for existing content, and `budget_exhausted` when the active pipeline run has already processed 10 documents. For n8n ingestion payloads, it echoes workflow context fields such as `runId`, `branchKey`, and `kpi` so downstream branch completion can use the authoritative run metadata.
