import { describe, expect, it, vi } from "vitest";
import {
  createKpiDefinition,
  loadEligibleKpisForPipeline,
  parseKpiDefinitionInput,
  updateKpiDefinition,
} from "./kpis";

const now = new Date("2026-08-05T12:00:00.000Z");

describe("KPI services", () => {
  it("parses required KPI definition fields and applies defaults", () => {
    expect(
      parseKpiDefinitionInput({
        name: " Internet penetration ",
        description: "Share online",
        expectedUnit: "percent",
        category: "Access",
      }),
    ).toMatchObject({
      name: "Internet penetration",
      description: "Share online",
      expectedUnit: "percent",
      category: "Access",
      sourceUrls: [],
      targetValue: null,
      fetchIntervalHours: 24,
    });
  });

  it("creates and updates controlled KPI definitions", async () => {
    const createdAt = new Date("2026-08-05T10:00:00.000Z");
    const updatedAt = new Date("2026-08-05T10:00:00.000Z");
    const kpi = {
      id: "kpi-1",
      name: "Digital jobs",
      description: "Jobs",
      expectedUnit: "jobs",
      targetValue: "1000000",
      category: "People",
      sourceUrls: ["https://digitalethiopia.tech"],
      fetchIntervalHours: 24,
      createdAt,
      updatedAt,
    };
    const client = {
      kpiDefinition: {
        create: vi.fn(async () => kpi),
        update: vi.fn(async () => ({ ...kpi, description: "Updated jobs" })),
      },
    };

    await expect(createKpiDefinition(kpi, client as never)).resolves.toMatchObject({
      id: "kpi-1",
      targetValue: "1000000",
      createdAt: createdAt.toISOString(),
    });
    await expect(updateKpiDefinition("kpi-1", kpi, client as never)).resolves.toMatchObject({
      description: "Updated jobs",
    });
    expect(client.kpiDefinition.create).toHaveBeenCalledWith({ data: kpi });
    expect(client.kpiDefinition.update).toHaveBeenCalledWith({ where: { id: "kpi-1" }, data: kpi });
  });

  it("loads at most 10 eligible KPIs for pipeline consumers", async () => {
    const oldObservation = { createdAt: new Date("2026-08-04T11:00:00.000Z") };
    const recentObservation = { createdAt: new Date("2026-08-05T11:00:00.000Z") };
    const kpis = Array.from({ length: 12 }, (_, index) => ({
      id: `kpi-${index}`,
      name: `KPI ${index}`,
      description: "Description",
      expectedUnit: "percent",
      targetValue: null,
      category: "Category",
      sourceUrls: [],
      fetchIntervalHours: 24,
      observations: index === 0 ? [recentObservation] : index === 1 ? [] : [oldObservation],
      createdAt: now,
      updatedAt: now,
    }));
    const client = {
      kpiDefinition: {
        findMany: vi.fn(async () => kpis),
      },
    };

    const result = await loadEligibleKpisForPipeline({ now }, client as never);

    expect(result).toHaveLength(10);
    expect(result.map((kpi) => kpi.id)).not.toContain("kpi-0");
    expect(client.kpiDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          observations: expect.objectContaining({ take: 1 }),
        }),
      }),
    );
  });
});
