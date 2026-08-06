import { parseConfidence } from "../integration/external-contracts";

export type ConfidenceGateDecision =
  | { action: "insert"; reviewFlag: false; confidence: number }
  | { action: "insert"; reviewFlag: true; confidence: number }
  | { action: "reject"; reviewFlag: null; confidence: number | null };

const autoInsertThreshold = 0.85;
const reviewThreshold = 0.6;

export function applyConfidenceGate(
  confidence: number | string | null | undefined,
): ConfidenceGateDecision {
  const normalizedConfidence = normalizeConfidence(confidence);

  if (normalizedConfidence === null || normalizedConfidence < reviewThreshold) {
    return { action: "reject", reviewFlag: null, confidence: normalizedConfidence };
  }

  if (normalizedConfidence < autoInsertThreshold) {
    return { action: "insert", reviewFlag: true, confidence: normalizedConfidence };
  }

  return { action: "insert", reviewFlag: false, confidence: normalizedConfidence };
}

// Confidence values must already be on the documented 0-1 scale; the range
// check is owned by the external-contracts validator (UNIT-0040) so the
// n8n-side and app-side gates cannot drift apart. Out-of-range values
// (including 1-100 style percentages) are rejected, never rescaled.
export function normalizeConfidence(confidence: number | string | null | undefined) {
  if (confidence === null || confidence === undefined || confidence === "") {
    return null;
  }

  const value = typeof confidence === "number" ? confidence : Number(confidence);
  const parsedConfidence = parseConfidence(value);

  return parsedConfidence === null ? null : roundConfidence(parsedConfidence);
}

function roundConfidence(value: number) {
  return Math.round(value * 1000) / 1000;
}
