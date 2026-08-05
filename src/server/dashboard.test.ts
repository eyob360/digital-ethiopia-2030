import { describe, expect, it, vi } from "vitest";
import { calculateTargetProgress, getDashboardKpis, getKpiHistory } from "./dashboard";

describe("dashboard services", () => {
  it("selects latest observations server-side and calculates target progress", async () => {
    const createdAt = new Date("2026-08-05T12:00:00.000Z");
    const client = {
      kpiDefinition: {
        findMany: vi.fn(async () => [
          {
            id: "kpi-1",
            name: "Digital economy share of GDP",
            description: "Digital economy",
            expectedUnit: "percent",
            targetValue: "12",
            category: "People",
            sourceUrls: ["https://digitalethiopia.tech"],
            fetchIntervalHours: 24,
            observations: [
              {
                id: "obs-1",
                kpiId: "kpi-1",
                rawDocumentId: null,
                value: "6",
                unit: "percent",
                region: "Ethiopia",
                observedDate: new Date("2026-08-05"),
                sourceUrl: "https://digitalethiopia.tech",
                aiConfidence: "0.900",
                reviewFlag: false,
                explanation: null,
                createdAt,
              },
            ],
          },
        ]),
      },
      kpiObservation: { findMany: vi.fn() },
    };

    await expect(getDashboardKpis(client as never)).resolves.toMatchObject([
      {
        id: "kpi-1",
        latestObservation: { sourceUrl: "https://digitalethiopia.tech", reviewFlag: false },
        targetProgress: { percent: 50, unit: "percent" },
      },
    ]);
    expect(client.kpiDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { observations: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
    );
  });

  it("omits target progress when target is missing or units differ", () => {
    expect(
      calculateTargetProgress({
        targetValue: null,
        expectedUnit: "percent",
        latestObservation: { value: "6", unit: "percent" },
      }),
    ).toBeNull();
    expect(
      calculateTargetProgress({
        targetValue: "12",
        expectedUnit: "percent",
        latestObservation: { value: "6", unit: "USD" },
      }),
    ).toBeNull();
  });

  it("returns KPI history ordered as a time series", async () => {
    const client = {
      kpiDefinition: { findMany: vi.fn() },
      kpiObservation: {
        findMany: vi.fn(async () => []),
      },
    };

    await getKpiHistory("kpi-1", client as never);

    expect(client.kpiObservation.findMany).toHaveBeenCalledWith({
      where: { kpiId: "kpi-1" },
      orderBy: [{ observedDate: "asc" }, { createdAt: "asc" }],
    });
  });
});
