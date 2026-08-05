import type { PrismaClient } from "@prisma/client";
import { createContentHash } from "../lib/pipeline";
import { prisma } from "../lib/prisma";

type RawDocumentClient = Pick<PrismaClient, "rawDocument">;

export type RawDocumentInput = {
  sourceUrl: string;
  rawText: string;
};

export function parseRawDocumentInput(input: unknown): RawDocumentInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const sourceUrl = asNonEmptyString(record.sourceUrl);
  const rawText = asNonEmptyString(record.rawText);

  return sourceUrl && rawText ? { sourceUrl, rawText } : null;
}

export async function storeRawDocumentIfNew(
  input: RawDocumentInput,
  client: RawDocumentClient = prisma,
) {
  const contentHash = createContentHash(input.rawText);
  const existingDocument = await client.rawDocument.findUnique({
    where: { contentHash },
  });

  if (existingDocument) {
    return {
      status: "duplicate" as const,
      rawDocument: serializeRawDocument(existingDocument),
      contentHash,
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
