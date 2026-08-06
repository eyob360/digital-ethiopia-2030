import { defineConfig, devices } from "@playwright/test";

/**
 * Validation-tier browser checks (D-0018). Not part of `npm test` (vitest only
 * includes src/**). Run explicitly with `npx playwright test`.
 *
 * Prerequisites:
 *   docker compose up -d
 *   SEED_OPERATOR_PASSWORD=<operator password> npm run db:seed
 *   node e2e/validation-data.mjs setup   # viewer user + test observations
 *   npm run dev                          # or let webServer below start it
 * Teardown: node e2e/validation-data.mjs teardown
 */
const port = process.env.E2E_PORT ?? "3210";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NEXTAUTH_URL: baseURL },
  },
});
