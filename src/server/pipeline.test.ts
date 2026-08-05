import { describe, expect, it, vi } from "vitest";
import {
  acquirePipelineLock,
  getPipelineLockStatus,
  loadPipelineKpiBatch,
  releasePipelineLock,
  startPipelineRun,
} from "./pipeline";

const updatedAt = new Date("2026-08-05T12:00:00.000Z");

describe("pipeline services", () => {
  it("creates or reads the ingestion lock status", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => ({
          name: "INGESTION",
          locked: false,
          lockedAt: null,
          updatedAt,
        })),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(getPipelineLockStatus(client as never)).resolves.toMatchObject({
      name: "INGESTION",
      locked: false,
    });
  });

  it("acquires the lock only when it is currently false", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => ({
          name: "INGESTION",
          locked: false,
          lockedAt: null,
          updatedAt,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(acquirePipelineLock(client as never, updatedAt)).resolves.toMatchObject({
      acquired: true,
    });
    expect(client.pipelineLock.updateMany).toHaveBeenCalledWith({
      where: { name: "INGESTION", locked: false },
      data: { locked: true, lockedAt: updatedAt },
    });
  });

  it("reports an already locked pipeline without loading KPIs", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => ({
          name: "INGESTION",
          locked: true,
          lockedAt: updatedAt,
          updatedAt,
        })),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(acquirePipelineLock(client as never, updatedAt)).resolves.toMatchObject({
      acquired: false,
      lock: { locked: true },
    });
    expect(client.kpiDefinition.findMany).not.toHaveBeenCalled();
  });

  it("releases the lock when a run completes", async () => {
    const client = {
      pipelineLock: {
        update: vi.fn(async () => ({
          name: "INGESTION",
          locked: false,
          lockedAt: null,
          updatedAt,
        })),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(releasePipelineLock(client as never)).resolves.toMatchObject({ locked: false });
    expect(client.pipelineLock.update).toHaveBeenCalledWith({
      where: { name: "INGESTION" },
      data: { locked: false, lockedAt: null },
    });
  });

  it("loads pipeline KPI batches through the eligibility service", async () => {
    const client = {
      pipelineLock: { upsert: vi.fn() },
      kpiDefinition: {
        findMany: vi.fn(async () => []),
      },
    };

    await expect(loadPipelineKpiBatch({ limit: 10 }, client as never)).resolves.toEqual([]);
    expect(client.kpiDefinition.findMany).toHaveBeenCalled();
  });

  it("starts a run by acquiring the lock before loading KPIs", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => ({
          name: "INGESTION",
          locked: false,
          lockedAt: null,
          updatedAt,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      kpiDefinition: {
        findMany: vi.fn(async () => []),
      },
    };

    await expect(startPipelineRun({ now: updatedAt }, client as never)).resolves.toMatchObject({
      started: true,
      kpis: [],
    });
    expect(client.pipelineLock.updateMany).toHaveBeenCalledBefore(client.kpiDefinition.findMany);
  });

  it("does not load KPIs when a start attempt finds an existing lock", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => ({
          name: "INGESTION",
          locked: true,
          lockedAt: updatedAt,
          updatedAt,
        })),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      kpiDefinition: {
        findMany: vi.fn(async () => []),
      },
    };

    await expect(startPipelineRun({ now: updatedAt }, client as never)).resolves.toMatchObject({
      started: false,
      kpis: [],
    });
    expect(client.kpiDefinition.findMany).not.toHaveBeenCalled();
  });
});
