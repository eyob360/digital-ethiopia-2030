import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

describe("ingestion observations API", () => {
  const previousApiKey = process.env.INGESTION_API_KEY;

  afterEach(() => {
    process.env.INGESTION_API_KEY = previousApiKey;
  });

  it("returns a routable 200 response for rejected observation candidates", async () => {
    process.env.INGESTION_API_KEY = "test-key";

    const response = await POST(
      new Request("http://localhost/api/ingestion/observations", {
        method: "POST",
        headers: {
          authorization: "Bearer test-key",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          runId: "run-1",
          branchKey: "kpi-1",
          kpiId: "kpi-1",
          rawDocumentId: "doc-1",
          value: 12,
          unit: "percent",
          region: "Ethiopia",
          observedDate: "2026-08-05",
          sourceUrl: "https://digitalethiopia.tech",
          aiConfidence: 0.2,
          explanation: "Low confidence candidate",
          fallbackUsed: false,
          sourceType: "priority",
          candidateUrls: ["https://digitalethiopia.tech/report"],
          priorityIndex: 0,
        }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "rejected",
      observation: null,
      runId: "run-1",
      branchKey: "kpi-1",
      kpiId: "kpi-1",
      fallbackUsed: false,
      sourceType: "priority",
      candidateUrls: ["https://digitalethiopia.tech/report"],
      priorityIndex: 0,
    });
    expect(response.status).toBe(200);
  });
});
