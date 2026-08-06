import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type UrlFilterConfigInput = {
  blockedDomains: string[];
  allowedDomains: string[];
};

export type StoredUrlFilterConfig = {
  blockedDomains: string[];
  allowedDomains: string[];
  updatedAt: string | null;
};

type UrlFilterConfigClient = Pick<PrismaClient, "urlFilterConfig">;

const configId = "default";
const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/**
 * Parses an operator payload of blocked/allowed domain override lists (D-0019).
 * Accepts pasted URLs or bare hostnames, normalizes them to lowercase apex-style
 * hostnames (scheme, path, and leading `www.` stripped), deduplicates, and
 * rejects the whole payload when an entry is not a plausible domain.
 */
export function parseUrlFilterConfigInput(input: unknown): UrlFilterConfigInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const blockedDomains = parseDomainList(record.blockedDomains);
  const allowedDomains = parseDomainList(record.allowedDomains);

  if (!blockedDomains || !allowedDomains) {
    return null;
  }

  return { blockedDomains, allowedDomains };
}

export async function getUrlFilterConfig(
  client: UrlFilterConfigClient = prisma,
): Promise<StoredUrlFilterConfig> {
  const config = await client.urlFilterConfig.findUnique({ where: { id: configId } });

  return serializeUrlFilterConfig(config);
}

export async function updateUrlFilterConfig(
  input: UrlFilterConfigInput,
  client: UrlFilterConfigClient = prisma,
): Promise<StoredUrlFilterConfig> {
  const config = await client.urlFilterConfig.upsert({
    where: { id: configId },
    create: { id: configId, ...input },
    update: input,
  });

  return serializeUrlFilterConfig(config);
}

function serializeUrlFilterConfig(
  config: { blockedDomains: string[]; allowedDomains: string[]; updatedAt: Date } | null,
): StoredUrlFilterConfig {
  return {
    blockedDomains: config?.blockedDomains ?? [],
    allowedDomains: config?.allowedDomains ?? [],
    updatedAt: config?.updatedAt.toISOString() ?? null,
  };
}

function parseDomainList(value: unknown): string[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const domains = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") {
      return null;
    }

    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = normalizeDomainEntry(trimmed);
    if (!normalized) {
      return null;
    }

    domains.add(normalized);
  }

  return [...domains];
}

function normalizeDomainEntry(entry: string): string | null {
  const withoutScheme = entry.toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  const hostname = withoutScheme.split(/[/?#]/, 1)[0].replace(/^www\./, "");

  return domainPattern.test(hostname) ? hostname : null;
}
