import { describe, expect, it } from "vitest";
import { applyConfidenceGate, normalizeConfidence } from "./confidence";

describe("confidence gate", () => {
  it("auto-inserts observations at or above 0.85", () => {
    expect(applyConfidenceGate(0.85)).toEqual({
      action: "insert",
      reviewFlag: false,
      confidence: 0.85,
    });
  });

  it("flags observations from 0.6 up to below 0.85 for review", () => {
    expect(applyConfidenceGate(0.6)).toEqual({
      action: "insert",
      reviewFlag: true,
      confidence: 0.6,
    });

    expect(applyConfidenceGate(0.849)).toEqual({
      action: "insert",
      reviewFlag: true,
      confidence: 0.849,
    });
  });

  it("rejects observations below 0.6 or with invalid confidence", () => {
    expect(applyConfidenceGate(0.599)).toEqual({
      action: "reject",
      reviewFlag: null,
      confidence: 0.599,
    });

    expect(applyConfidenceGate("not-a-number")).toEqual({
      action: "reject",
      reviewFlag: null,
      confidence: null,
    });
  });

  it("normalizes percentage-style confidence inputs", () => {
    expect(normalizeConfidence("87")).toBe(0.87);
    expect(normalizeConfidence(120)).toBeNull();
  });
});
