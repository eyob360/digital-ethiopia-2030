---
id: D-0009
date: 2026-08-05
kind: decision
status: active
relates-to: [BRD-0002]
supersedes:
superseded-by:
---

# D-0009: Raw document deduplication

**Question:** Should raw documents be stored before or after duplicate detection when the same content hash already exists?

**Decision:** Compute the content hash first and store raw document text only when the hash is new. Duplicate content should not create another `raw_documents` row.

**Why:** This preserves traceability for unique evidence while avoiding repeated storage and downstream AI processing for identical content. A lightweight fetch/skip log may be added later if operational observability requires it.
