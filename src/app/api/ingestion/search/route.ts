import {
  parseSearchInput,
  SearchProviderConfigError,
  TavilySearchProvider,
} from "@/server/search/tavily";
import { requireIngestionApiKey } from "@/server/api/ingestion-auth";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function POST(request: Request) {
  const auth = requireIngestionApiKey(request);
  if (!auth.ok) {
    return auth.response;
  }

  const input = parseSearchInput(await readJsonBody(request));
  if (!input) {
    return jsonError("Invalid search payload", 400);
  }

  try {
    return jsonOk({ results: await new TavilySearchProvider().search(input) });
  } catch (error) {
    if (error instanceof SearchProviderConfigError) {
      return jsonError(error.message, 500);
    }

    throw error;
  }
}
