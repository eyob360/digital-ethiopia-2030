import { describe, expect, it } from "vitest";
import { requireIngestionApiKey } from "./ingestion-auth";

describe("requireIngestionApiKey", () => {
  it("fails clearly when the ingestion API key is not configured", async () => {
    const previousKey = process.env.INGESTION_API_KEY;
    delete process.env.INGESTION_API_KEY;

    const result = requireIngestionApiKey(new Request("http://localhost/api/ingestion/kpis"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toEqual({
        error: "INGESTION_API_KEY is not configured",
      });
    }

    process.env.INGESTION_API_KEY = previousKey;
  });

  it("accepts matching bearer tokens and rejects mismatches", () => {
    const previousKey = process.env.INGESTION_API_KEY;
    process.env.INGESTION_API_KEY = "local-key";

    expect(
      requireIngestionApiKey(
        new Request("http://localhost/api/ingestion/kpis", {
          headers: { authorization: "Bearer local-key" },
        }),
      ),
    ).toEqual({ ok: true });

    const wrongTokens = [
      "local-kez", // same length, wrong content
      "wrong", // shorter than the configured key
      "local-key-with-a-much-longer-suffix", // longer than the configured key
    ];

    for (const token of wrongTokens) {
      const rejected = requireIngestionApiKey(
        new Request("http://localhost/api/ingestion/kpis", {
          headers: { authorization: `Bearer ${token}` },
        }),
      );

      expect(rejected.ok, `token ${JSON.stringify(token)}`).toBe(false);
      if (!rejected.ok) {
        expect(rejected.response.status, `token ${JSON.stringify(token)}`).toBe(401);
      }
    }

    process.env.INGESTION_API_KEY = previousKey;
  });

  it("rejects requests without a bearer authorization header", () => {
    const previousKey = process.env.INGESTION_API_KEY;
    process.env.INGESTION_API_KEY = "local-key";

    for (const headers of [undefined, { authorization: "Basic local-key" }] as const) {
      const rejected = requireIngestionApiKey(
        new Request("http://localhost/api/ingestion/kpis", headers ? { headers } : undefined),
      );

      expect(rejected.ok).toBe(false);
      if (!rejected.ok) {
        expect(rejected.response.status).toBe(401);
      }
    }

    process.env.INGESTION_API_KEY = previousKey;
  });
});
