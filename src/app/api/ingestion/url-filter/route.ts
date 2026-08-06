import { filterCandidateUrls } from "@/lib/pipeline";
import { requireIngestionApiKey } from "@/server/api/ingestion-auth";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";
import { getUrlFilterConfig } from "@/server/url-filter-config";

export async function POST(request: Request) {
  const auth = requireIngestionApiKey(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  if (!body || typeof body !== "object" || !Array.isArray((body as { urls?: unknown }).urls)) {
    return jsonError("Invalid URL filter payload", 400);
  }

  const record = body as Record<string, unknown>;
  const urls = record.urls as string[];
  const operatorConfig = await getUrlFilterConfig();

  return jsonOk({
    urls: filterCandidateUrls(urls, {
      allowedDomains: [
        ...operatorConfig.allowedDomains,
        ...(parseStringArray(record.allowedDomains) ?? []),
      ],
      blockedDomains: [
        ...operatorConfig.blockedDomains,
        ...(parseStringArray(record.blockedDomains) ?? []),
      ],
      maxUrls:
        typeof record.maxUrls === "number" && record.maxUrls > 0
          ? Math.floor(record.maxUrls)
          : undefined,
    }),
  });
}

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}
