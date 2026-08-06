import { asNonEmptyString } from "../strings";

export type OpenAiQueryGenerationContract = {
  queries: string[];
};

export type OpenAiRelevanceContract = {
  confidence: number;
  relevant: boolean;
};

export type OpenAiExtractionContract = {
  confidence: number;
  explanation: string;
  observed_date: string;
  region: string;
  unit: string;
  value_numeric: number;
};

export type TavilySearchContract = {
  results: Array<{
    title: string;
    url: string;
    content?: string;
  }>;
};

export function parseOpenAiQueryGeneration(input: unknown): OpenAiQueryGenerationContract | null {
  if (!isRecord(input) || !Array.isArray(input.queries)) {
    return null;
  }

  const queries = input.queries.filter(
    (query): query is string => typeof query === "string" && !!query.trim(),
  );

  return queries.length ? { queries: queries.map((query) => query.trim()) } : null;
}

export function parseOpenAiRelevance(input: unknown): OpenAiRelevanceContract | null {
  if (!isRecord(input) || typeof input.relevant !== "boolean") {
    return null;
  }

  const confidence = parseConfidence(input.confidence);
  return confidence === null ? null : { confidence, relevant: input.relevant };
}

export function parseOpenAiExtraction(input: unknown): OpenAiExtractionContract | null {
  if (!isRecord(input)) {
    return null;
  }

  const confidence = parseConfidence(input.confidence);
  const explanation = asNonEmptyString(input.explanation);
  const observedDate = parseDateString(input.observed_date);
  const region = asNonEmptyString(input.region);
  const unit = asNonEmptyString(input.unit);
  const valueNumeric = typeof input.value_numeric === "number" ? input.value_numeric : null;

  if (
    confidence === null ||
    explanation === null ||
    observedDate === null ||
    region === null ||
    unit === null ||
    valueNumeric === null ||
    !Number.isFinite(valueNumeric)
  ) {
    return null;
  }

  return {
    confidence,
    explanation,
    observed_date: observedDate,
    region,
    unit,
    value_numeric: valueNumeric,
  };
}

export function parseTavilySearchResponse(input: unknown): TavilySearchContract | null {
  if (!isRecord(input) || !Array.isArray(input.results)) {
    return null;
  }

  const results = input.results.flatMap((result) => {
    if (!isRecord(result)) {
      return [];
    }

    const title = asNonEmptyString(result.title);
    const url = parseHttpUrl(result.url);
    if (!title || !url) {
      return [];
    }

    const content = asNonEmptyString(result.content);
    return [{ title, url, ...(content ? { content } : {}) }];
  });

  return results.length ? { results } : null;
}

// Single confidence contract for AI outputs: a finite number on the documented
// 0-1 scale. Anything else (including 1-100 style values) is rejected, never
// rescaled.
export function parseConfidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}

function parseDateString(value: unknown) {
  const text = asNonEmptyString(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function parseHttpUrl(value: unknown) {
  const text = asNonEmptyString(value);
  if (!text) {
    return null;
  }

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
