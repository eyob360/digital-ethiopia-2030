# Operations Runbook

This runbook covers local integration checks for the Digital Ethiopia 2030 MVP. It avoids live OpenAI/Tavily calls by default; use real keys only for an explicit manual dry run.

## Environment

Required local values:

- `DATABASE_URL` — PostgreSQL connection used by Prisma and the app.
- `AUTH_SECRET` and `NEXTAUTH_SECRET` — local Auth.js secrets.
- `NEXTAUTH_URL` — local app URL, usually `http://localhost:3000`.
- `INGESTION_API_KEY` — bearer key shared by n8n and `/api/ingestion/*`.
- `N8N_BASIC_AUTH_USER` and `N8N_BASIC_AUTH_PASSWORD` — local n8n login.
- `SEED_OPERATOR_PASSWORD` — set before seeding if the operator login should be created.

Optional for live external dry runs:

- `OPENAI_API_KEY` — used by n8n OpenAI nodes.
- `TAVILY_API_KEY` — used by the app-side Tavily provider.

Do not commit real secret values. `.env.example` documents names only.

## Local Services

Start PostgreSQL and n8n:

```bash
docker compose up -d
```

The compose file pins n8n to `n8nio/n8n:2.33.0`; update the tag deliberately and rerun the workflow export tests before changing it.

Validate compose wiring without starting containers:

```bash
docker compose config
```

Start the app:

```bash
npm run dev
```

The default app URL is `http://localhost:3000`; n8n is exposed at `http://localhost:5678`.

## Seed And Reset

Apply migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

Create the local operator account by setting `SEED_OPERATOR_PASSWORD` before `npm run db:seed`.

Reset local database state when destructive reset is acceptable:

```bash
npm run db:reset
```

`db:reset` drops and recreates local data. Use it only against a disposable local database, and do not run it as part of automated validation without explicit operator approval.

## Full Checks

Run before marking integration work done:

```bash
npm run lint
npm test
npm run build
npm run format
npx prisma validate
docker compose config
```

Default tests use checked-in OpenAI/Tavily/n8n mocks and contract validators. They must not require live credentials.

## n8n Dry Run

1. Start PostgreSQL, n8n, and the app with `INGESTION_API_KEY` configured.
2. Import `n8n/workflows/digital-ethiopia-ingestion.json` into n8n.
3. Set `APP_BASE_URL` so n8n can reach the app. With Docker n8n and host app, use `http://host.docker.internal:3000`.
4. For live fallback/AI testing only, configure `OPENAI_API_KEY` in n8n and `TAVILY_API_KEY` in the app environment.
5. Run the workflow manually once and confirm the pipeline lock releases through `/api/ingestion/pipeline/runs` with `action=complete`.

## Troubleshooting

- Missing or wrong `INGESTION_API_KEY`: ingestion routes return `401`.
- Missing `TAVILY_API_KEY`: fallback search fails closed with a configuration error; default tests cover this without a live key.
- Held pipeline lock: call the ingestion pipeline complete action with the bearer key, or reset the local database if the run is disposable.
- Document cap reached: `/api/ingestion/raw-documents` returns `budget_exhausted`; no raw document row is created.
- n8n process crash mid-run: release the pipeline lock manually after confirming no active workflow run is still processing.

## Carried-Forward Notes

The validated WO-0006 workflow intentionally leaves three operational hardening notes for follow-up:

- `Complete Pipeline Run` can release the lock when the first terminal branch finishes; late branches then fail closed on the app-side budget counter. This under-processes rather than over-processes.
- A crash in n8n can leave the lock held until manual release.
- After budget exhaustion, fallback branches may still spend bounded query-generation and Tavily calls, but no relevance/extraction calls occur because raw-document storage is refused.
