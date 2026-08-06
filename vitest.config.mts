import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    env: {
      // src/lib/prisma.ts fails loudly when DATABASE_URL is unset (WO-0014).
      // Unit tests never open a connection (they pass mocked clients), so a
      // clearly fake URL satisfies module load without hiding a real misconfig.
      DATABASE_URL: "postgresql://vitest:vitest@localhost:5432/vitest_fake_db?schema=public",
    },
  },
});
