export type ObservationCandidate = {
  value: number | string | null | undefined;
  unit: string | null | undefined;
  observedDate: Date | string | null | undefined;
  region?: string | null;
  sourceUrl?: string | null;
};

export type NormalizedObservation = {
  value: number;
  unit: string;
  observedDate: string;
  region: string;
  sourceUrl: string;
};

const currencyScale: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  m: 1_000_000,
  million: 1_000_000,
  b: 1_000_000_000,
  billion: 1_000_000_000,
};

export function normalizeObservationCandidate(candidate: ObservationCandidate) {
  const normalizedUnit = normalizeUnit(candidate.unit);
  const normalizedValue = normalizeValue(candidate.value, normalizedUnit);
  const observedDate = normalizeObservedDate(candidate.observedDate);
  const region = candidate.region?.trim() || "Ethiopia";
  const sourceUrl = candidate.sourceUrl?.trim() || "";

  if (normalizedValue === null || !normalizedUnit || !observedDate || !sourceUrl) {
    return null;
  }

  return {
    value: normalizedValue,
    unit: normalizedUnit,
    observedDate,
    region,
    sourceUrl,
  } satisfies NormalizedObservation;
}

export function normalizeObservedDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function normalizeUnit(unit: string | null | undefined) {
  const normalizedUnit = unit?.trim();

  if (!normalizedUnit) {
    return null;
  }

  const lowerUnit = normalizedUnit.toLowerCase();
  if (lowerUnit === "%" || lowerUnit === "percentage") {
    return "percent";
  }

  if (lowerUnit === "$" || lowerUnit === "usd" || lowerUnit === "us dollars") {
    return "USD";
  }

  return normalizedUnit;
}

export function normalizeValue(value: number | string | null | undefined, unit: string | null) {
  if (value === null || value === undefined || !unit) {
    return null;
  }

  const parsedValue = typeof value === "number" ? value : parseNumericValue(value);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  if (unit === "percent" && (parsedValue < 0 || parsedValue > 100)) {
    return null;
  }

  return roundValue(parsedValue);
}

function parseNumericValue(value: string) {
  const trimmedValue = value.trim();
  const match = trimmedValue.match(
    /^[$€£]?\s*(-?\d+(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)\s*([a-zA-Z%]*)$/,
  );

  if (!match) {
    return Number.NaN;
  }

  const numericValue = Number(match[1].replaceAll(",", ""));
  const suffix = match[2].toLowerCase();

  if (!Number.isFinite(numericValue)) {
    return Number.NaN;
  }

  return numericValue * (currencyScale[suffix] ?? 1);
}

function roundValue(value: number) {
  return Math.round(value * 10_000) / 10_000;
}
