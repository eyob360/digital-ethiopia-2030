import type { PipelineLockName, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { loadEligibleKpisForPipeline } from "./kpis";

type PipelineBudgetClient = Pick<PrismaClient, "pipelineLock">;
type PipelineClient = Pick<PrismaClient, "pipelineLock" | "kpiDefinition">;

const ingestionLockName: PipelineLockName = "INGESTION";
export const PIPELINE_DOCUMENT_LIMIT = 10;
export const DEFAULT_PIPELINE_LOCK_STALE_AFTER_MINUTES = 120;

type AcquirePipelineLockOptions = {
  staleAfterMs?: number;
};

export type CompletePipelineRunBranchInput = {
  runId: string;
  branchKey: string;
};

export async function getPipelineLockStatus(client: PipelineClient = prisma) {
  const lock = await client.pipelineLock.upsert({
    where: { name: ingestionLockName },
    update: {},
    create: {
      name: ingestionLockName,
      locked: false,
      documentsProcessed: 0,
      branchesTotal: 0,
      branchesCompleted: 0,
      completedBranchKeys: [],
    },
  });

  return serializePipelineLock(lock);
}

export async function acquirePipelineLock(
  client: PipelineClient = prisma,
  now = new Date(),
  options: AcquirePipelineLockOptions = {},
) {
  await getPipelineLockStatus(client);

  const staleBefore = new Date(now.getTime() - getPipelineLockStaleAfterMs(options));
  const runId = randomUUID();

  const updateResult = await client.pipelineLock.updateMany({
    where: {
      name: ingestionLockName,
      OR: [
        { locked: false },
        { locked: true, lockedAt: { lt: staleBefore } },
        { locked: true, lockedAt: null },
      ],
    },
    data: {
      locked: true,
      lockedAt: now,
      runId,
      branchesTotal: 0,
      branchesCompleted: 0,
      completedBranchKeys: [],
      documentsProcessed: 0,
    },
  });

  if (updateResult.count === 0) {
    return { acquired: false, lock: await getPipelineLockStatus(client) };
  }

  return { acquired: true, lock: await getPipelineLockStatus(client) };
}

export async function releasePipelineLock(client: PipelineClient = prisma) {
  const lock = await client.pipelineLock.update({
    where: { name: ingestionLockName },
    data: {
      locked: false,
      lockedAt: null,
      runId: null,
      branchesTotal: 0,
      branchesCompleted: 0,
      completedBranchKeys: [],
      documentsProcessed: 0,
    },
  });

  return serializePipelineLock(lock);
}

export async function completePipelineRunBranch(
  input: CompletePipelineRunBranchInput,
  client: PipelineClient = prisma,
) {
  const updateResult = await client.pipelineLock.updateMany({
    where: {
      name: ingestionLockName,
      locked: true,
      runId: input.runId,
      branchesTotal: { gt: 0 },
      NOT: { completedBranchKeys: { has: input.branchKey } },
    },
    data: {
      branchesCompleted: { increment: 1 },
      completedBranchKeys: { push: input.branchKey },
    },
  });

  const lock = await getPipelineLockStatus(client);
  if (
    updateResult.count === 1 &&
    lock.locked &&
    lock.runId === input.runId &&
    lock.branchesTotal > 0 &&
    lock.branchesCompleted >= lock.branchesTotal
  ) {
    return {
      completed: true,
      released: true,
      lock: await releaseCompletedPipelineRun(input.runId, client),
    };
  }

  return {
    completed: updateResult.count === 1,
    released: false,
    lock,
  };
}

export async function startPipelineRun(
  options: { now?: Date; limit?: number } = {},
  client: PipelineClient = prisma,
) {
  const now = options.now ?? new Date();
  const lockResult = await acquirePipelineLock(client, now);

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

  const lock = await client.pipelineLock.update({
    where: { name: ingestionLockName },
    data: { branchesTotal: kpis.length, branchesCompleted: 0, completedBranchKeys: [] },
  });

  return {
    started: true,
    runId: lock.runId,
    lock: serializePipelineLock(lock),
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

async function releaseCompletedPipelineRun(runId: string, client: PipelineClient) {
  await client.pipelineLock.updateMany({
    where: { name: ingestionLockName, locked: true, runId },
    data: {
      locked: false,
      lockedAt: null,
      runId: null,
      branchesTotal: 0,
      branchesCompleted: 0,
      completedBranchKeys: [],
      documentsProcessed: 0,
    },
  });

  return getPipelineLockStatus(client);
}

function getPipelineLockStaleAfterMs(options: AcquirePipelineLockOptions) {
  if (options.staleAfterMs !== undefined) {
    return options.staleAfterMs;
  }

  const configuredMinutes = Number(process.env.PIPELINE_LOCK_STALE_AFTER_MINUTES);
  const minutes =
    Number.isFinite(configuredMinutes) && configuredMinutes > 0
      ? configuredMinutes
      : DEFAULT_PIPELINE_LOCK_STALE_AFTER_MINUTES;

  return minutes * 60 * 1000;
}

function serializePipelineLock(lock: {
  name: PipelineLockName;
  locked: boolean;
  lockedAt: Date | null;
  runId?: string | null;
  branchesTotal?: number;
  branchesCompleted?: number;
  completedBranchKeys?: string[];
  documentsProcessed: number;
  updatedAt: Date;
}) {
  return {
    name: lock.name,
    locked: lock.locked,
    lockedAt: lock.lockedAt?.toISOString() ?? null,
    runId: lock.runId ?? null,
    branchesTotal: lock.branchesTotal ?? 0,
    branchesCompleted: lock.branchesCompleted ?? 0,
    completedBranchKeys: lock.completedBranchKeys ?? [],
    documentsProcessed: lock.documentsProcessed,
    updatedAt: lock.updatedAt.toISOString(),
  };
}
