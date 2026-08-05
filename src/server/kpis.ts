import type { PrismaClient } from "@prisma/client";
import { isKpiEligibleForIngestion } from "../lib/pipeline";
import { prisma } from "../lib/prisma";

export type KpiDefinitionInput = {
  name: string;
  description: string;
  expectedUnit: string;
  category: string;
  sourceUrls?: string[];
  targetValue?: string | number | null;
  fetchIntervalHours?: number;
};

type KpiClient = Pick<PrismaClient, "kpiDefinition">;

export function parseKpiDefinitionInput(input: unknown): KpiDefinitionInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const name = asNonEmptyString(record.name);
  const description = asNonEmptyString(record.description);
  const expectedUnit = asNonEmptyString(record.expectedUnit);
  const category = asNonEmptyString(record.category);

  if (!name || !description || !expectedUnit || !category) {
    return null;
  }

  const sourceUrls = Array.isArray(record.sourceUrls)
    ? record.sourceUrls.filter((url): url is string => typeof url === "string")
    : [];
  const fetchIntervalHours =
    typeof record.fetchIntervalHours === "number" && record.fetchIntervalHours > 0
      ? Math.floor(record.fetchIntervalHours)
      : 24;
  const targetValue =
    record.targetValue === null || record.targetValue === undefined || record.targetValue === ""
      ? null
      : String(record.targetValue);

  return {
    name,
    description,
    expectedUnit,
    category,
    sourceUrls,
    targetValue,
    fetchIntervalHours,
  };
}

export async function listKpiDefinitions(client: KpiClient = prisma) {
  const kpis = await client.kpiDefinition.findMany({
    orderBy: { name: "asc" },
  });

  return kpis.map(serializeKpiDefinition);
}

export async function getKpiDefinition(id: string, client: KpiClient = prisma) {
  const kpi = await client.kpiDefinition.findUnique({ where: { id } });

  return kpi ? serializeKpiDefinition(kpi) : null;
}

export async function createKpiDefinition(input: KpiDefinitionInput, client: KpiClient = prisma) {
  const kpi = await client.kpiDefinition.create({ data: input });

  return serializeKpiDefinition(kpi);
}

export async function updateKpiDefinition(
  id: string,
  input: KpiDefinitionInput,
  client: KpiClient = prisma,
) {
  const kpi = await client.kpiDefinition.update({ where: { id }, data: input });

  return serializeKpiDefinition(kpi);
}

export async function deleteKpiDefinition(id: string, client: KpiClient = prisma) {
  await client.kpiDefinition.delete({ where: { id } });
}

export async function loadEligibleKpisForPipeline(
  options: { now?: Date; limit?: number } = {},
  client: KpiClient = prisma,
) {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 10;
  const kpis = await client.kpiDefinition.findMany({
    include: {
      observations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return kpis
    .filter((kpi) =>
      isKpiEligibleForIngestion({
        latestObservationCreatedAt: kpi.observations[0]?.createdAt,
        fetchIntervalHours: kpi.fetchIntervalHours,
        now,
      }),
    )
    .slice(0, limit)
    .map((kpi) => serializeKpiDefinition(kpi));
}

export function serializeKpiDefinition(kpi: {
  id: string;
  name: string;
  description: string;
  expectedUnit: string;
  targetValue: unknown;
  category: string;
  sourceUrls: string[];
  fetchIntervalHours: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: kpi.id,
    name: kpi.name,
    description: kpi.description,
    expectedUnit: kpi.expectedUnit,
    targetValue: kpi.targetValue === null ? null : String(kpi.targetValue),
    category: kpi.category,
    sourceUrls: kpi.sourceUrls,
    fetchIntervalHours: kpi.fetchIntervalHours,
    createdAt: kpi.createdAt.toISOString(),
    updatedAt: kpi.updatedAt.toISOString(),
  };
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
