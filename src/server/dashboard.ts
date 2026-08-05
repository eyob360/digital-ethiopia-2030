import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { serializeObservation } from "./observations";

type DashboardClient = Pick<PrismaClient, "kpiDefinition" | "kpiObservation">;

export async function getDashboardKpis(client: DashboardClient = prisma) {
  const kpis = await client.kpiDefinition.findMany({
    include: {
      observations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return kpis.map((kpi) => {
    const latestObservation = kpi.observations[0]
      ? serializeObservation(kpi.observations[0])
      : null;

    return {
      id: kpi.id,
      name: kpi.name,
      description: kpi.description,
      expectedUnit: kpi.expectedUnit,
      category: kpi.category,
      sourceUrls: kpi.sourceUrls,
      targetValue: kpi.targetValue === null ? null : String(kpi.targetValue),
      fetchIntervalHours: kpi.fetchIntervalHours,
      latestObservation,
      targetProgress: calculateTargetProgress({
        targetValue: kpi.targetValue,
        expectedUnit: kpi.expectedUnit,
        latestObservation: kpi.observations[0] ?? null,
      }),
    };
  });
}

export async function getKpiHistory(kpiId: string, client: DashboardClient = prisma) {
  const observations = await client.kpiObservation.findMany({
    where: { kpiId },
    orderBy: [{ observedDate: "asc" }, { createdAt: "asc" }],
  });

  return observations.map(serializeObservation);
}

export function calculateTargetProgress(input: {
  targetValue: unknown;
  expectedUnit: string;
  latestObservation: { value: unknown; unit: string } | null;
}) {
  if (input.targetValue === null || !input.latestObservation) {
    return null;
  }

  if (input.latestObservation.unit !== input.expectedUnit) {
    return null;
  }

  const currentValue = Number(input.latestObservation.value);
  const targetValue = Number(input.targetValue);

  if (!Number.isFinite(currentValue) || !Number.isFinite(targetValue) || targetValue === 0) {
    return null;
  }

  return {
    currentValue: String(input.latestObservation.value),
    targetValue: String(input.targetValue),
    unit: input.expectedUnit,
    percent: Math.round((currentValue / targetValue) * 10_000) / 100,
  };
}
