import type { PrismaClient } from "@prisma/client";
import { applyConfidenceGate, normalizeObservationCandidate } from "../lib/pipeline";
import { prisma } from "../lib/prisma";

export type ObservationInput = {
  kpiId: string;
  rawDocumentId?: string | null;
  value: number | string;
  unit: string;
  region?: string | null;
  observedDate: Date | string;
  sourceUrl: string;
  aiConfidence: number | string;
  explanation?: string | null;
};

type ObservationClient = Pick<PrismaClient, "kpiObservation">;

export function parseObservationInput(input: unknown): ObservationInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const kpiId = asNonEmptyString(record.kpiId);
  const unit = asNonEmptyString(record.unit);
  const sourceUrl = asNonEmptyString(record.sourceUrl);

  if (
    !kpiId ||
    !unit ||
    !sourceUrl ||
    record.value === undefined ||
    !record.observedDate ||
    record.aiConfidence === undefined
  ) {
    return null;
  }

  return {
    kpiId,
    rawDocumentId:
      typeof record.rawDocumentId === "string" && record.rawDocumentId.trim()
        ? record.rawDocumentId.trim()
        : null,
    value: record.value as number | string,
    unit,
    region: typeof record.region === "string" ? record.region : null,
    observedDate: record.observedDate as Date | string,
    sourceUrl,
    aiConfidence: record.aiConfidence as number | string,
    explanation: typeof record.explanation === "string" ? record.explanation : null,
  };
}

export async function appendAcceptedObservation(
  input: ObservationInput,
  client: ObservationClient = prisma,
) {
  const normalizedObservation = normalizeObservationCandidate(input);
  const confidenceDecision = applyConfidenceGate(input.aiConfidence);

  if (!normalizedObservation || confidenceDecision.action === "reject") {
    return { status: "rejected" as const, observation: null };
  }

  const observation = await client.kpiObservation.create({
    data: {
      kpiId: input.kpiId,
      rawDocumentId: input.rawDocumentId ?? undefined,
      value: normalizedObservation.value,
      unit: normalizedObservation.unit,
      region: normalizedObservation.region,
      observedDate: new Date(normalizedObservation.observedDate),
      sourceUrl: normalizedObservation.sourceUrl,
      aiConfidence: confidenceDecision.confidence,
      reviewFlag: confidenceDecision.reviewFlag,
      explanation: input.explanation ?? undefined,
    },
  });

  return { status: "inserted" as const, observation: serializeObservation(observation) };
}

export function serializeObservation(observation: {
  id: string;
  kpiId: string;
  rawDocumentId?: string | null;
  value: unknown;
  unit: string;
  region: string;
  observedDate: Date;
  sourceUrl: string;
  aiConfidence: unknown;
  reviewFlag: boolean;
  explanation?: string | null;
  createdAt: Date;
}) {
  return {
    id: observation.id,
    kpiId: observation.kpiId,
    rawDocumentId: observation.rawDocumentId ?? null,
    value: String(observation.value),
    unit: observation.unit,
    region: observation.region,
    observedDate: observation.observedDate.toISOString().slice(0, 10),
    sourceUrl: observation.sourceUrl,
    aiConfidence: String(observation.aiConfidence),
    reviewFlag: observation.reviewFlag,
    explanation: observation.explanation ?? null,
    createdAt: observation.createdAt.toISOString(),
  };
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
