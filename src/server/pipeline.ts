import type { PipelineLockName, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { loadEligibleKpisForPipeline } from "./kpis";

type PipelineClient = Pick<PrismaClient, "pipelineLock" | "kpiDefinition">;

const ingestionLockName: PipelineLockName = "INGESTION";

export async function getPipelineLockStatus(client: PipelineClient = prisma) {
  const lock = await client.pipelineLock.upsert({
    where: { name: ingestionLockName },
    update: {},
    create: { name: ingestionLockName, locked: false },
  });

  return serializePipelineLock(lock);
}

export async function acquirePipelineLock(client: PipelineClient = prisma, now = new Date()) {
  await getPipelineLockStatus(client);

  const updateResult = await client.pipelineLock.updateMany({
    where: { name: ingestionLockName, locked: false },
    data: { locked: true, lockedAt: now },
  });

  if (updateResult.count === 0) {
    return { acquired: false, lock: await getPipelineLockStatus(client) };
  }

  return { acquired: true, lock: await getPipelineLockStatus(client) };
}

export async function releasePipelineLock(client: PipelineClient = prisma) {
  const lock = await client.pipelineLock.update({
    where: { name: ingestionLockName },
    data: { locked: false, lockedAt: null },
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

function serializePipelineLock(lock: {
  name: PipelineLockName;
  locked: boolean;
  lockedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    name: lock.name,
    locked: lock.locked,
    lockedAt: lock.lockedAt?.toISOString() ?? null,
    updatedAt: lock.updatedAt.toISOString(),
  };
}
