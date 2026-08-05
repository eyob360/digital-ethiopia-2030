export type FetchEligibilityInput = {
  latestObservationCreatedAt?: Date | string | null;
  fetchIntervalHours?: number | null;
  now?: Date;
};

const defaultFetchIntervalHours = 24;

export function isKpiEligibleForIngestion(input: FetchEligibilityInput) {
  const latestObservationCreatedAt = parseDate(input.latestObservationCreatedAt);

  if (!latestObservationCreatedAt) {
    return true;
  }

  const fetchIntervalHours =
    typeof input.fetchIntervalHours === "number" && input.fetchIntervalHours > 0
      ? input.fetchIntervalHours
      : defaultFetchIntervalHours;
  const now = input.now ?? new Date();
  const thresholdMs = now.getTime() - fetchIntervalHours * 60 * 60 * 1000;

  return latestObservationCreatedAt.getTime() < thresholdMs;
}

function parseDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
