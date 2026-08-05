import type { PipelineLockName, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { loadEligibleKpisForPipeline } from "./kpis";

type PipelineBudgetClient = Pick<PrismaClient, "pipelineLock">;
type PipelineClient = Pick<PrismaClient, "pipelineLock" | "kpiDefinition">;

const ingestionLockName: PipelineLockName = "INGESTION";
export const PIPELINE_DOCUMENT_LIMIT = 10;

export async function getPipelineLockStatus(client: PipelineClient = prisma) {
  const lock = await client.pipelineLock.upsert({
    where: { name: ingestionLockName },
    update: {},
    create: { name: ingestionLockName, locked: false, documentsProcessed: 0 },
  });

  return serializePipelineLock(lock);
}

export async function acquirePipelineLock(client: PipelineClient = prisma, now = new Date()) {
  await getPipelineLockStatus(client);

  const updateResult = await client.pipelineLock.updateMany({
    where: { name: ingestionLockName, locked: false },
    data: { locked: true, lockedAt: now, documentsProcessed: 0 },
  });

  if (updateResult.count === 0) {
    return { acquired: false, lock: await getPipelineLockStatus(client) };
  }

  return { acquired: true, lock: await getPipelineLockStatus(client) };
}

export async function releasePipelineLock(client: PipelineClient = prisma) {
  const lock = await client.pipelineLock.update({
    where: { name: ingestionLockName },
    data: { locked: false, lockedAt: null, documentsProcessed: 0 },
  });

  return serializePipelineLock(lock);
}

export async function startPipelineRun(
  options: { now?: Date; limit?: number } = {},
  client: PipelineClient = prisma,
) {
  const lockResult = await acquirePipelineLock(client, options.now);

  if (!lockResult.acquired) {
    return {
      started: false,
      lock: lockResult.lock,
      kpis: [],
    };
  }

  const kpis = await loadEligibleKpisForPipeline(options, client);

  if (!kpis.length) {
    return {
      started: true,
      lock: await releasePipelineLock(client),
      kpis,
    };
  }

  return {
    started: true,
    lock: lockResult.lock,
    kpis,
  };
}

export async function reservePipelineDocumentSlot(client: PipelineBudgetClient = prisma) {
  const updateResult = await client.pipelineLock.updateMany({
    where: {
      name: ingestionLockName,
      locked: true,
      documentsProcessed: { lt: PIPELINE_DOCUMENT_LIMIT },
    },
    data: { documentsProcessed: { increment: 1 } },
  });

  return { reserved: updateResult.count === 1 };
}

function serializePipelineLock(lock: {
  name: PipelineLockName;
  locked: boolean;
  lockedAt: Date | null;
  documentsProcessed: number;
  updatedAt: Date;
}) {
  return {
    name: lock.name,
    locked: lock.locked,
    lockedAt: lock.lockedAt?.toISOString() ?? null,
    documentsProcessed: lock.documentsProcessed,
    updatedAt: lock.updatedAt.toISOString(),
  };
}
