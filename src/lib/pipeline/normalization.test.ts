import { describe, expect, it } from "vitest";
import {
  normalizeObservedDate,
  normalizeObservationCandidate,
  normalizeUnit,
  normalizeValue,
} from "./normalization";

describe("normalization", () => {
  it("normalizes percentage values and units", () => {
    expect(normalizeUnit("%")).toBe("percent");
    expect(normalizeValue("12.5%", "percent")).toBe(12.5);
    expect(normalizeValue("101%", "percent")).toBeNull();
  });

  it("normalizes currency suffixes into base units", () => {
    expect(normalizeUnit("$")).toBe("USD");
    expect(normalizeValue("$3.2B", "USD")).toBe(3_200_000_000);
    expect(normalizeValue("4,500,000", "USD")).toBe(4_500_000);
  });

  it("standardizes valid dates to ISO date strings", () => {
    expect(normalizeObservedDate("2026-08-05T09:30:00+03:00")).toBe("2026-08-05");
  });

  it("rejects invalid value, unit, date, and source inputs", () => {
    expect(
      normalizeObservationCandidate({
        value: "not numeric",
        unit: "percent",
        observedDate: "2026-08-05",
        sourceUrl: "https://id.gov.et",
      }),
    ).toBeNull();

    expect(
      normalizeObservationCandidate({
        value: 12,
        unit: "",
        observedDate: "2026-08-05",
        sourceUrl: "https://id.gov.et",
      }),
    ).toBeNull();

    expect(
      normalizeObservationCandidate({
        value: 12,
        unit: "percent",
        observedDate: "not-a-date",
        sourceUrl: "https://id.gov.et",
      }),
    ).toBeNull();
  });

  it("returns a normalized observation with Ethiopia as the default region", () => {
    expect(
      normalizeObservationCandidate({
        value: "12%",
        unit: "%",
        observedDate: "2026-08-05",
        sourceUrl: "https://digitalethiopia.tech",
      }),
    ).toEqual({
      value: 12,
      unit: "percent",
      observedDate: "2026-08-05",
      region: "Ethiopia",
      sourceUrl: "https://digitalethiopia.tech",
    });
  });
});
