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

type TavilyResponse = {
  results?: Array<{
    title?: unknown;
    url?: unknown;
    content?: unknown;
  }>;
};

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

      const body = (await response.json()) as TavilyResponse;
      for (const result of body.results ?? []) {
        if (typeof result.url !== "string" || seenUrls.has(result.url)) {
          continue;
        }

        seenUrls.add(result.url);
        results.push({
          title: typeof result.title === "string" ? result.title : result.url,
          url: result.url,
          content: typeof result.content === "string" ? result.content : undefined,
        });

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
  const queries = Array.isArray(record.queries)
    ? record.queries.filter((query): query is string => typeof query === "string" && !!query.trim())
    : [];

  if (!queries.length) {
    return null;
  }

  return {
    queries: queries.map((query) => query.trim()),
    maxResults:
      typeof record.maxResults === "number" && record.maxResults > 0
        ? Math.floor(record.maxResults)
        : undefined,
  };
}
