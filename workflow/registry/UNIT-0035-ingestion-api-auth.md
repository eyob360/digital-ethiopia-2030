---
id: UNIT-0035
name: Ingestion API auth
kind: service
path: src/server/api/ingestion-auth.ts
status: active
---

# UNIT-0035: Ingestion API auth

**Purpose:** Bearer-token guard for n8n-facing ingestion API routes.

**Interface:** `requireIngestionApiKey(request)`.

**Variants/options:** Requires `INGESTION_API_KEY`; returns a clear configuration error when unset.
