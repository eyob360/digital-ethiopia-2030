import { describe, expect, it } from "vitest";
import { initialKpis } from "./initial-catalogue";

describe("initial KPI catalogue", () => {
  it("contains the approved starter KPI set", () => {
    expect(initialKpis).toHaveLength(10);
    expect(initialKpis.map((kpi) => kpi.name)).toContain("Fayda digital ID registrations");
    expect(initialKpis.map((kpi) => kpi.name)).toContain("Basic certifications (5M Coders)");
  });

  it("defaults each starter KPI to the approved 24 hour fetch interval", () => {
    expect(initialKpis.every((kpi) => kpi.fetchIntervalHours === 24)).toBe(true);
  });

  it("allows targetless starter KPIs", () => {
    expect(initialKpis.some((kpi) => kpi.targetValue === undefined)).toBe(true);
  });
});
