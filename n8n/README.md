# n8n Ingestion Workflow

This folder contains the versioned n8n workflow source for WO-0006.

## Files
- `workflows/digital-ethiopia-ingestion.json` — importable n8n workflow export.
- `mocks/openai-query-generation.json` — valid query-generation response shape.
- `mocks/openai-relevance.json` — valid relevance-classification response shape.
- `mocks/openai-extraction.json` — valid extraction response shape.
- `mocks/tavily-search.json` — valid fallback-search response shape.

## Required Environment
- `APP_BASE_URL` — Next.js app base URL, for example `http://host.docker.internal:3000`.
- `INGESTION_API_KEY` — bearer token shared with the app's ingestion API routes.
- `OPENAI_API_KEY` — OpenAI API key held in n8n credentials or environment.
- `TAVILY_API_KEY` — Tavily API key held by the app server, not n8n.

## Dry Run
1. Start Postgres and the web app with `INGESTION_API_KEY` configured.
2. Import `workflows/digital-ethiopia-ingestion.json` into n8n.
3. Configure `APP_BASE_URL` and `OPENAI_API_KEY` in the n8n environment.
4. Run manually once. The workflow starts the pipeline through `/api/ingestion/pipeline/runs`.
5. If the lock is already held, the workflow exits without loading KPIs because it did not acquire the lock.
6. When a KPI has priority URLs, the workflow tries them sequentially. A stored observation completes the run path for that KPI; failed priority URLs advance to the next priority URL, and fallback begins only after the final priority URL fails.
7. If a branch enters fallback, it sets `fallbackUsed=true` before requesting OpenAI-generated queries. Duplicate, irrelevant, invalid, or empty fallback branches do not re-enter fallback.
8. Each KPI branch carries the `runId` from `/api/ingestion/pipeline/runs` plus a `branchKey` based on the KPI id.
9. The app raw-document endpoint enforces the 10-document limit atomically on the ingestion lock row, so parallel priority and fallback lineages share one authoritative per-run cap.
10. Terminal paths that can otherwise produce zero surviving items route to `Complete Pipeline Run`, which calls `/api/ingestion/pipeline/runs` with `action=complete`, `runId`, and `branchKey`. The app releases the lock only after every KPI branch has reported terminal completion.

## Retry Policy
HTTP fetches, OpenAI calls, and app/database-backed ingestion API calls use n8n node retries: 5 tries with 2 seconds between tries. Retry is configured at the node level so earlier successful nodes in the branch are not rerun.

## Cost Controls
- The pipeline runs hourly.
- The app batch loader caps KPI definitions at 10 per run.
- Candidate URL filtering caps source URLs at 5 per KPI.
- `/api/ingestion/raw-documents` is the authoritative cross-lineage counter and refuses documents after 10 stored or duplicate-checked documents in an active run.
- The workflow has no vector database, queue, warehouse, real-time stream, paid data API beyond configured providers, custom ML model, multilingual processing, or advanced entity resolution.

## Crash Recovery
- `PIPELINE_LOCK_STALE_AFTER_MINUTES` controls stale-lock recovery in the app. If unset, a lock older than 120 minutes is considered stale on the next start attempt and can be acquired for a new run.
