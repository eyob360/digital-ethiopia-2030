import { defineConfig } from "prisma/config";

try {
  // The Prisma CLI evaluates this config without loading .env; pick up the
  // local .env without overriding variables already set in the environment.
  process.loadEnvFile();
} catch {
  // No .env file — rely on the process environment.
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Configure it in your environment or .env file (see .env.example).",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
});
