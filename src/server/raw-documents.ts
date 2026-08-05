import type { PrismaClient } from "@prisma/client";
import { createContentHash } from "../lib/pipeline";
import { prisma } from "../lib/prisma";
import { reservePipelineDocumentSlot } from "./pipeline";

type RawDocumentClient = Pick<PrismaClient, "pipelineLock" | "rawDocument">;

export type RawDocumentInput = {
  sourceUrl: string;
  rawText: string;
  workflowContext?: RawDocumentWorkflowContext;
};

type RawDocumentWorkflowContext = {
  runId?: string;
  branchKey?: string;
  kpi?: unknown;
  fallbackUsed?: boolean;
  candidateUrls?: unknown[];
  priorityIndex?: number;
  sourceType?: string;
};

export function parseRawDocumentInput(input: unknown): RawDocumentInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const sourceUrl = asNonEmptyString(record.sourceUrl);
  const rawText = asNonEmptyString(record.rawText);

  return sourceUrl && rawText
    ? { sourceUrl, rawText, workflowContext: parseWorkflowContext(record) }
    : null;
}

export async function storeRawDocumentIfNew(
  input: RawDocumentInput,
  client: RawDocumentClient = prisma,
) {
  const slot = await reservePipelineDocumentSlot(client);
  if (!slot.reserved) {
    return {
      status: "budget_exhausted" as const,
      rawDocument: null,
      contentHash: null,
      ...input.workflowContext,
    };
  }

  const contentHash = createContentHash(input.rawText);
  const existingDocument = await client.rawDocument.findUnique({
    where: { contentHash },
  });

  if (existingDocument) {
    return {
      status: "duplicate" as const,
      rawDocument: serializeRawDocument(existingDocument),
      contentHash,
      ...input.workflowContext,
    };
  }

  const rawDocument = await client.rawDocument.create({
    data: {
      sourceUrl: input.sourceUrl,
      rawText: input.rawText,
      contentHash,
    },
  });

  return {
    status: "stored" as const,
    rawDocument: serializeRawDocument(rawDocument),
    contentHash,
    ...input.workflowContext,
  };
}

export function serializeRawDocument(rawDocument: {
  id: string;
  sourceUrl: string;
  rawText: string;
  contentHash: string;
  createdAt: Date;
}) {
  return {
    id: rawDocument.id,
    sourceUrl: rawDocument.sourceUrl,
    rawText: rawDocument.rawText,
    contentHash: rawDocument.contentHash,
    createdAt: rawDocument.createdAt.toISOString(),
  };
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseWorkflowContext(record: Record<string, unknown>): RawDocumentWorkflowContext {
  const context: RawDocumentWorkflowContext = {};
  const runId = asNonEmptyString(record.runId);
  const branchKey = asNonEmptyString(record.branchKey);
  const sourceType = asNonEmptyString(record.sourceType);

  if (runId) context.runId = runId;
  if (branchKey) context.branchKey = branchKey;
  if (record.kpi && typeof record.kpi === "object") context.kpi = record.kpi;
  if (typeof record.fallbackUsed === "boolean") context.fallbackUsed = record.fallbackUsed;
  if (Array.isArray(record.candidateUrls)) context.candidateUrls = record.candidateUrls;
  if (typeof record.priorityIndex === "number") context.priorityIndex = record.priorityIndex;
  if (sourceType) context.sourceType = sourceType;

  return context;
}
