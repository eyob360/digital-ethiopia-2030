import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getUrlFilterConfig = vi.hoisted(() =>
  vi.fn(async () => ({
    blockedDomains: [] as string[],
    allowedDomains: [] as string[],
    updatedAt: null as string | null,
  })),
);

vi.mock("@/server/url-filter-config", () => ({ getUrlFilterConfig }));

describe("POST /api/ingestion/url-filter", () => {
  let previousKey: string | undefined;

  beforeEach(() => {
    previousKey = process.env.INGESTION_API_KEY;
    process.env.INGESTION_API_KEY = "test-key";
    getUrlFilterConfig.mockClear();
  });

  afterEach(() => {
    process.env.INGESTION_API_KEY = previousKey;
  });

  it("applies the stored operator configuration on every request", async () => {
    getUrlFilterConfig.mockResolvedValueOnce({
      blockedDomains: ["example-farm.com"],
      allowedDomains: ["medium.com"],
      updatedAt: "2026-08-06T00:00:00.000Z",
    });

    const response = await POST(
      makeRequest({
        urls: [
          "https://example-farm.com/post",
          "https://medium.com/@analyst/report",
          "https://itu.int/publication",
          "https://facebook.com/page",
        ],
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      urls: [
        { url: "https://medium.com/@analyst/report", hostname: "medium.com" },
        { url: "https://itu.int/publication", hostname: "itu.int" },
      ],
    });
    expect(getUrlFilterConfig).toHaveBeenCalledTimes(1);
  });

  it("falls back to default-only filtering when no operator overrides are stored", async () => {
    const response = await POST(
      makeRequest({ urls: ["https://addisstandard.com/story", "https://bit.ly/x"] }),
    );

    await expect(response.json()).resolves.toEqual({
      urls: [{ url: "https://addisstandard.com/story", hostname: "addisstandard.com" }],
    });
  });

  it("rejects requests without a valid ingestion API key", async () => {
    const response = await POST(
      new Request("http://localhost/api/ingestion/url-filter", {
        body: JSON.stringify({ urls: [] }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(getUrlFilterConfig).not.toHaveBeenCalled();
  });

  it("rejects payloads without a urls array", async () => {
    const response = await POST(makeRequest({ urls: "https://itu.int" }));

    expect(response.status).toBe(400);
  });
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/ingestion/url-filter", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", authorization: "Bearer test-key" },
    method: "POST",
  });
}
