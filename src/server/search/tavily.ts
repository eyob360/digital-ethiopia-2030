import {
  parseOpenAiQueryGeneration,
  parseTavilySearchResponse,
} from "../../lib/integration/external-contracts";

export type SearchProvider = {
  search(input: SearchProviderInput): Promise<SearchProviderResult[]>;
};

export type SearchProviderInput = {
  queries: string[];
  maxResults?: number;
};

export type SearchProviderResult = {
  title: string;
  url: string;
  content?: string;
};

export class SearchProviderConfigError extends Error {}

export class TavilySearchProvider implements SearchProvider {
  constructor(
    private readonly options: {
      apiKey?: string;
      fetchImpl?: typeof fetch;
      endpoint?: string;
    } = {},
  ) {}

  async search(input: SearchProviderInput) {
    const apiKey = this.options.apiKey ?? process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new SearchProviderConfigError("TAVILY_API_KEY is not configured");
    }

    const fetchImpl = this.options.fetchImpl ?? fetch;
    const endpoint = this.options.endpoint ?? "https://api.tavily.com/search";
    const maxResults = input.maxResults ?? 5;
    const results: SearchProviderResult[] = [];
    const seenUrls = new Set<string>();

    for (const query of input.queries) {
      const response = await fetchImpl(endpoint, {
        body: JSON.stringify({
          api_key: apiKey,
          max_results: maxResults,
          query,
          search_depth: "basic",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed with status ${response.status}`);
      }

      // Strict external contract (UNIT-0040): result rows without a non-empty
      // title or a valid http(s) URL are dropped instead of patched up.
      const contract = parseTavilySearchResponse(await response.json());
      for (const result of contract?.results ?? []) {
        if (seenUrls.has(result.url)) {
          continue;
        }

        seenUrls.add(result.url);
        results.push(result);

        if (results.length >= maxResults) {
          return results;
        }
      }
    }

    return results;
  }
}

export function parseSearchInput(input: unknown): SearchProviderInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const generation = parseOpenAiQueryGeneration(record);
  if (!generation) {
    return null;
  }

  return {
    queries: generation.queries,
    maxResults:
      typeof record.maxResults === "number" && record.maxResults > 0
        ? Math.floor(record.maxResults)
        : undefined,
  };
}
