import { describe, expect, it, vi } from "vitest";
import { appendAcceptedObservation, parseObservationInput } from "./observations";

describe("observation services", () => {
  it("parses observation input and requires storage fields", () => {
    expect(
      parseObservationInput({
        kpiId: "kpi-1",
        value: "12%",
        unit: "%",
        observedDate: "2026-08-05",
        sourceUrl: "https://digitalethiopia.tech",
        aiConfidence: 0.9,
      }),
    ).toMatchObject({ kpiId: "kpi-1", sourceUrl: "https://digitalethiopia.tech" });

    expect(parseObservationInput({ value: 12 })).toBeNull();
  });

  it("appends accepted observations without updating old rows", async () => {
    const createdAt = new Date("2026-08-05T12:00:00.000Z");
    const create = vi.fn(async ({ data }) => ({
      id: `obs-${create.mock.calls.length}`,
      rawDocumentId: null,
      createdAt,
      ...data,
    }));
    const client = { kpiObservation: { create } };
    const input = {
      kpiId: "kpi-1",
      value: "12%",
      unit: "%",
      observedDate: "2026-08-05",
      sourceUrl: "https://digitalethiopia.tech",
      aiConfidence: 0.9,
    };

    await appendAcceptedObservation(input, client as never);
    await appendAcceptedObservation({ ...input, value: "13%" }, client as never);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: expect.any(Object) }),
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: expect.any(Object) }),
    );
  });

  it("sets review flags from confidence thresholds and rejects low-confidence rows", async () => {
    const createdAt = new Date("2026-08-05T12:00:00.000Z");
    const create = vi.fn(async ({ data }) => ({
      id: "obs-1",
      rawDocumentId: null,
      createdAt,
      ...data,
    }));
    const client = { kpiObservation: { create } };
    const baseInput = {
      kpiId: "kpi-1",
      value: 12,
      unit: "percent",
      observedDate: "2026-08-05",
      sourceUrl: "https://digitalethiopia.tech",
    };

    await expect(
      appendAcceptedObservation({ ...baseInput, aiConfidence: 0.84 }, client as never),
    ).resolves.toMatchObject({ status: "inserted", observation: { reviewFlag: true } });
    await expect(
      appendAcceptedObservation({ ...baseInput, aiConfidence: 0.59 }, client as never),
    ).resolves.toEqual({ status: "rejected", observation: null });

    expect(create).toHaveBeenCalledTimes(1);
  });
});
