import { describe, expect, it, vi } from "vitest";
import { calculateTargetProgress, getDashboardKpis, getKpiHistory } from "./dashboard";

describe("dashboard services", () => {
  it("selects latest observations server-side and serializes the dashboard shape", async () => {
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
          {
            id: "kpi-2",
            name: "Digital exports",
            description: "Export revenue",
            expectedUnit: "USD",
            targetValue: null,
            category: "People",
            sourceUrls: [],
            fetchIntervalHours: 24,
            observations: [],
          },
        ]),
      },
      kpiObservation: { findMany: vi.fn() },
    };

    await expect(getDashboardKpis(client as never)).resolves.toEqual([
      {
        id: "kpi-1",
        name: "Digital economy share of GDP",
        description: "Digital economy",
        expectedUnit: "percent",
        category: "People",
        sourceUrls: ["https://digitalethiopia.tech"],
        targetValue: "12",
        fetchIntervalHours: 24,
        latestObservation: {
          id: "obs-1",
          kpiId: "kpi-1",
          rawDocumentId: null,
          value: "6",
          unit: "percent",
          region: "Ethiopia",
          observedDate: "2026-08-05",
          sourceUrl: "https://digitalethiopia.tech",
          aiConfidence: "0.900",
          reviewFlag: false,
          explanation: null,
          createdAt: createdAt.toISOString(),
        },
        targetProgress: {
          currentValue: "6",
          targetValue: "12",
          unit: "percent",
          percent: 50,
        },
      },
      {
        id: "kpi-2",
        name: "Digital exports",
        description: "Export revenue",
        expectedUnit: "USD",
        category: "People",
        sourceUrls: [],
        targetValue: null,
        fetchIntervalHours: 24,
        latestObservation: null,
        targetProgress: null,
      },
    ]);

    // Latest-observation selection happens in the query, not in memory: only
    // the newest observation per KPI is fetched.
    expect(client.kpiDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { observations: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
    );
    expect(client.kpiObservation.findMany).not.toHaveBeenCalled();
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
    expect(
      calculateTargetProgress({
        targetValue: "0",
        expectedUnit: "percent",
        latestObservation: { value: "6", unit: "percent" },
      }),
    ).toBeNull();
  });

  it("returns KPI history as a serialized time series in query order", async () => {
    const observations = [
      {
        id: "obs-1",
        kpiId: "kpi-1",
        rawDocumentId: null,
        value: "5",
        unit: "percent",
        region: "Ethiopia",
        observedDate: new Date("2026-07-01"),
        sourceUrl: "https://digitalethiopia.tech",
        aiConfidence: "0.870",
        reviewFlag: false,
        explanation: null,
        createdAt: new Date("2026-07-01T09:00:00.000Z"),
      },
      {
        id: "obs-2",
        kpiId: "kpi-1",
        rawDocumentId: "doc-1",
        value: "6",
        unit: "percent",
        region: "Ethiopia",
        observedDate: new Date("2026-08-05"),
        sourceUrl: "https://digitalethiopia.tech",
        aiConfidence: "0.900",
        reviewFlag: true,
        explanation: "Updated figure",
        createdAt: new Date("2026-08-05T12:00:00.000Z"),
      },
    ];
    const client = {
      kpiDefinition: { findMany: vi.fn() },
      kpiObservation: {
        findMany: vi.fn(async () => observations),
      },
    };

    await expect(getKpiHistory("kpi-1", client as never)).resolves.toEqual([
      {
        id: "obs-1",
        kpiId: "kpi-1",
        rawDocumentId: null,
        value: "5",
        unit: "percent",
        region: "Ethiopia",
        observedDate: "2026-07-01",
        sourceUrl: "https://digitalethiopia.tech",
        aiConfidence: "0.870",
        reviewFlag: false,
        explanation: null,
        createdAt: "2026-07-01T09:00:00.000Z",
      },
      {
        id: "obs-2",
        kpiId: "kpi-1",
        rawDocumentId: "doc-1",
        value: "6",
        unit: "percent",
        observedDate: "2026-08-05",
        region: "Ethiopia",
        sourceUrl: "https://digitalethiopia.tech",
        aiConfidence: "0.900",
        reviewFlag: true,
        explanation: "Updated figure",
        createdAt: "2026-08-05T12:00:00.000Z",
      },
    ]);

    // Ordering is delegated to the database: the query must request the
    // chronological time series.
    expect(client.kpiObservation.findMany).toHaveBeenCalledWith({
      where: { kpiId: "kpi-1" },
      orderBy: [{ observedDate: "asc" }, { createdAt: "asc" }],
    });
  });
});
