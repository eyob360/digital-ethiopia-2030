# Digital Ethiopia 2030 Intelligence Dashboard

MVP web application for monitoring Digital Ethiopia 2030 KPIs and supporting an automated KPI ingestion pipeline.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment defaults:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL and n8n:

   ```bash
   docker compose up -d
   ```

4. Start the web app:

   ```bash
   npm run dev
   ```

## Checks

```bash
npm run lint
npm test
npm run build
docker compose config
```
