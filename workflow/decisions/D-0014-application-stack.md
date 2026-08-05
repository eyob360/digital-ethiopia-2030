---
id: D-0014
date: 2026-08-05
kind: decision
status: active
relates-to: [BRD-0001, BRD-0002, BRD-0003]
supersedes:
superseded-by:
---

# D-0014: Application stack

**Question:** What stack and development commands should the web app use?

**Decision:** Use Next.js with TypeScript, Tailwind CSS with shadcn-style components, PostgreSQL, Prisma migrations as the schema authority, Auth.js for login/roles, n8n for pipeline orchestration, OpenAI API for AI extraction/classification, and Tavily for fallback web search.

Planned commands:

- Dev server: `npm run dev`
- Full dev stack: `docker compose up -d && npm run dev`
- Tests: `npm test`
- Lint / format: `npm run lint` and `npm run format`
- Dev data: Prisma seed/reset commands to be defined when the app scaffold and database are created.

**Why:** The user accepted the recommended stack. Auth.js was selected as the concrete auth option because it fits the chosen Next.js + Prisma/PostgreSQL stack without adding a second hosted backend platform.
