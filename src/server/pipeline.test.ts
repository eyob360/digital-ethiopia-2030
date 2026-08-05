import { describe, expect, it, vi } from "vitest";
import {
  acquirePipelineLock,
  completePipelineRunBranch,
  getPipelineLockStatus,
  releasePipelineLock,
  reservePipelineDocumentSlot,
  startPipelineRun,
} from "./pipeline";

const updatedAt = new Date("2026-08-05T12:00:00.000Z");
const activeRunId = "run-1";

function lock(overrides: Record<string, unknown> = {}) {
  return {
    name: "INGESTION",
    locked: false,
    lockedAt: null,
    runId: null,
    branchesTotal: 0,
    branchesCompleted: 0,
    completedBranchKeys: [],
    documentsProcessed: 0,
    updatedAt,
    ...overrides,
  };
}

describe("pipeline services", () => {
  it("creates or reads the ingestion lock status", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => lock()),
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
        upsert: vi.fn(async () => lock()),
        updateMany: vi.fn(async () => ({ count: 1 })),
        update: vi.fn(async () => lock()),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(acquirePipelineLock(client as never, updatedAt)).resolves.toMatchObject({
      acquired: true,
    });
    expect(client.pipelineLock.updateMany).toHaveBeenCalledWith({
      where: {
        name: "INGESTION",
        OR: expect.arrayContaining([{ locked: false }, { locked: true, lockedAt: null }]),
      },
      data: {
        locked: true,
        lockedAt: updatedAt,
        runId: expect.any(String),
        branchesTotal: 0,
        branchesCompleted: 0,
        completedBranchKeys: [],
        documentsProcessed: 0,
      },
    });
  });

  it("acquires stale locks using lockedAt as the recovery cutoff", async () => {
    const staleLockedAt = new Date("2026-08-05T09:59:59.000Z");
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => lock({ locked: true, lockedAt: staleLockedAt })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(
      acquirePipelineLock(client as never, updatedAt, { staleAfterMs: 2 * 60 * 60 * 1000 }),
    ).resolves.toMatchObject({
      acquired: true,
    });
    expect(client.pipelineLock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { locked: true, lockedAt: { lt: new Date("2026-08-05T10:00:00.000Z") } },
          ]),
        }),
      }),
    );
  });

  it("reports an already locked pipeline without loading KPIs", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => lock({ locked: true, lockedAt: updatedAt })),
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
        update: vi.fn(async () => lock()),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(releasePipelineLock(client as never)).resolves.toMatchObject({ locked: false });
    expect(client.pipelineLock.update).toHaveBeenCalledWith({
      where: { name: "INGESTION" },
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
  });

  it("records branch completion without releasing before all branches are terminal", async () => {
    const client = {
      pipelineLock: {
        updateMany: vi.fn(async () => ({ count: 1 })),
        upsert: vi.fn(async () =>
          lock({
            locked: true,
            lockedAt: updatedAt,
            runId: activeRunId,
            branchesTotal: 3,
            branchesCompleted: 2,
            completedBranchKeys: ["kpi-1", "kpi-2"],
          }),
        ),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(
      completePipelineRunBranch({ runId: activeRunId, branchKey: "kpi-2" }, client as never),
    ).resolves.toMatchObject({
      completed: true,
      released: false,
      lock: { locked: true, branchesCompleted: 2 },
    });
    expect(client.pipelineLock.updateMany).toHaveBeenCalledWith({
      where: {
        name: "INGESTION",
        locked: true,
        runId: activeRunId,
        branchesTotal: { gt: 0 },
        NOT: { completedBranchKeys: { has: "kpi-2" } },
      },
      data: {
        branchesCompleted: { increment: 1 },
        completedBranchKeys: { push: "kpi-2" },
      },
    });
  });

  it("releases exactly when the final branch completes", async () => {
    const client = {
      pipelineLock: {
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 }),
        upsert: vi
          .fn()
          .mockResolvedValueOnce(
            lock({
              locked: true,
              lockedAt: updatedAt,
              runId: activeRunId,
              branchesTotal: 2,
              branchesCompleted: 2,
              completedBranchKeys: ["kpi-1", "kpi-2"],
            }),
          )
          .mockResolvedValueOnce(lock()),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(
      completePipelineRunBranch({ runId: activeRunId, branchKey: "kpi-2" }, client as never),
    ).resolves.toMatchObject({
      completed: true,
      released: true,
      lock: { locked: false, documentsProcessed: 0 },
    });
    expect(client.pipelineLock.updateMany).toHaveBeenLastCalledWith({
      where: { name: "INGESTION", locked: true, runId: activeRunId },
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
  });

  it("reserves document slots only while the ingestion run is under budget", async () => {
    const client = {
      pipelineLock: {
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(reservePipelineDocumentSlot(client as never)).resolves.toEqual({
      reserved: true,
    });
    expect(client.pipelineLock.updateMany).toHaveBeenCalledWith({
      where: {
        name: "INGESTION",
        locked: true,
        documentsProcessed: { lt: 10 },
      },
      data: { documentsProcessed: { increment: 1 } },
    });
  });

  it("rejects document slot reservations when the run is not active or at budget", async () => {
    const client = {
      pipelineLock: {
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      kpiDefinition: { findMany: vi.fn() },
    };

    await expect(reservePipelineDocumentSlot(client as never)).resolves.toEqual({
      reserved: false,
    });
  });

  it("starts a run by acquiring the lock before loading KPIs", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => lock()),
        updateMany: vi.fn(async () => ({ count: 1 })),
        update: vi.fn(async () => lock()),
      },
      kpiDefinition: {
        findMany: vi.fn(async () => []),
      },
    };

    await expect(startPipelineRun({ now: updatedAt }, client as never)).resolves.toMatchObject({
      lock: { locked: false },
      started: true,
      kpis: [],
    });
    expect(client.pipelineLock.updateMany).toHaveBeenCalledBefore(client.kpiDefinition.findMany);
    expect(client.pipelineLock.update).toHaveBeenCalledWith({
      where: { name: "INGESTION" },
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
  });

  it("initializes branch totals for a started run with eligible KPIs", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => lock({ locked: true, runId: activeRunId })),
        updateMany: vi.fn(async () => ({ count: 1 })),
        update: vi.fn(async () =>
          lock({
            locked: true,
            lockedAt: updatedAt,
            runId: activeRunId,
            branchesTotal: 2,
            branchesCompleted: 0,
          }),
        ),
      },
      kpiDefinition: {
        findMany: vi.fn(async () => [
          {
            id: "kpi-1",
            name: "Access",
            description: "Access KPI",
            expectedUnit: "percent",
            targetValue: null,
            category: "Services",
            sourceUrls: [],
            fetchIntervalHours: 24,
            observations: [],
            createdAt: updatedAt,
            updatedAt,
          },
          {
            id: "kpi-2",
            name: "Connectivity",
            description: "Connectivity KPI",
            expectedUnit: "percent",
            targetValue: null,
            category: "Infrastructure",
            sourceUrls: [],
            fetchIntervalHours: 24,
            observations: [],
            createdAt: updatedAt,
            updatedAt,
          },
        ]),
      },
    };

    await expect(startPipelineRun({ now: updatedAt }, client as never)).resolves.toMatchObject({
      started: true,
      runId: activeRunId,
      lock: { locked: true, runId: activeRunId, branchesTotal: 2 },
      kpis: [{ id: "kpi-1" }, { id: "kpi-2" }],
    });
    expect(client.pipelineLock.update).toHaveBeenCalledWith({
      where: { name: "INGESTION" },
      data: { branchesTotal: 2, branchesCompleted: 0, completedBranchKeys: [] },
    });
  });

  it("does not load KPIs when a start attempt finds an existing lock", async () => {
    const client = {
      pipelineLock: {
        upsert: vi.fn(async () => lock({ locked: true, lockedAt: updatedAt })),
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
