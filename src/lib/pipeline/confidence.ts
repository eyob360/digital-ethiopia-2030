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

export function normalizeConfidence(confidence: number | string | null | undefined) {
  if (confidence === null || confidence === undefined || confidence === "") {
    return null;
  }

  const value = typeof confidence === "number" ? confidence : Number(confidence);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (value > 1 && value <= 100) {
    return roundConfidence(value / 100);
  }

  if (value < 0 || value > 1) {
    return null;
  }

  return roundConfidence(value);
}

function roundConfidence(value: number) {
  return Math.round(value * 1000) / 1000;
}
