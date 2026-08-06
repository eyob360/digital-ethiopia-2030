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

  it("accepts only the documented 0-1 confidence scale", () => {
    expect(normalizeConfidence(0)).toBe(0);
    expect(normalizeConfidence(1)).toBe(1);
    expect(normalizeConfidence("0.87")).toBe(0.87);
    expect(normalizeConfidence(0.8765)).toBe(0.877);
  });

  it("rejects out-of-range confidence instead of rescaling it", () => {
    // WO-0013: 1-100 style values were previously rescaled by /100; they are
    // now rejected at the boundary like every other out-of-range input.
    expect(normalizeConfidence("87")).toBeNull();
    expect(normalizeConfidence(87)).toBeNull();
    expect(normalizeConfidence(1.2)).toBeNull();
    expect(normalizeConfidence(120)).toBeNull();
    expect(normalizeConfidence(-0.1)).toBeNull();
    expect(normalizeConfidence(Number.NaN)).toBeNull();

    expect(applyConfidenceGate(85)).toEqual({
      action: "reject",
      reviewFlag: null,
      confidence: null,
    });
  });
});
