import { describe, expect, it } from "vitest";
import { isKpiEligibleForIngestion } from "./fetch-eligibility";

const now = new Date("2026-08-05T12:00:00.000Z");

describe("isKpiEligibleForIngestion", () => {
  it("allows ingestion when a KPI has no observations", () => {
    expect(isKpiEligibleForIngestion({ now, latestObservationCreatedAt: null })).toBe(true);
  });

  it("allows ingestion when the latest observation is older than the fetch interval", () => {
    expect(
      isKpiEligibleForIngestion({
        now,
        fetchIntervalHours: 24,
        latestObservationCreatedAt: "2026-08-04T11:59:59.999Z",
      }),
    ).toBe(true);
  });

  it("skips ingestion at the exact threshold and newer", () => {
    expect(
      isKpiEligibleForIngestion({
        now,
        fetchIntervalHours: 24,
        latestObservationCreatedAt: "2026-08-04T12:00:00.000Z",
      }),
    ).toBe(false);

    expect(
      isKpiEligibleForIngestion({
        now,
        fetchIntervalHours: 24,
        latestObservationCreatedAt: "2026-08-05T08:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("uses the default 24 hour interval when the stored interval is invalid", () => {
    expect(
      isKpiEligibleForIngestion({
        now,
        fetchIntervalHours: 0,
        latestObservationCreatedAt: "2026-08-04T11:00:00.000Z",
      }),
    ).toBe(true);
  });
});
