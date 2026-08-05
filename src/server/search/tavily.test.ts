import { describe, expect, it } from "vitest";
import { parseSearchInput, SearchProviderConfigError, TavilySearchProvider } from "./tavily";

describe("TavilySearchProvider", () => {
  it("fails clearly when the Tavily API key is missing", async () => {
    const provider = new TavilySearchProvider({ apiKey: "" });

    await expect(provider.search({ queries: ["digital jobs ethiopia"] })).rejects.toThrow(
      SearchProviderConfigError,
    );
  });

  it("deduplicates provider URLs and caps results across queries", async () => {
    const requests: unknown[] = [];
    const provider = new TavilySearchProvider({
      apiKey: "test-key",
      fetchImpl: async (_url, init) => {
        requests.push(JSON.parse(String(init?.body)));
        return Response.json({
          results: [
            { title: "A", url: "https://statsethiopia.gov.et/report-a", content: "A" },
            { title: "A duplicate", url: "https://statsethiopia.gov.et/report-a" },
            { title: "B", url: "https://worldbank.org/report-b" },
          ],
        });
      },
    });

    const results = await provider.search({
      maxResults: 2,
      queries: ["digital exports ethiopia", "digital economy gdp ethiopia"],
    });

    expect(requests).toHaveLength(1);
    expect(results).toEqual([
      { title: "A", url: "https://statsethiopia.gov.et/report-a", content: "A" },
      { title: "B", url: "https://worldbank.org/report-b", content: undefined },
    ]);
  });

  it("parses non-empty query arrays", () => {
    expect(parseSearchInput({ maxResults: 3, queries: [" one ", "", 5, "two"] })).toEqual({
      maxResults: 3,
      queries: ["one", "two"],
    });
    expect(parseSearchInput({ queries: [] })).toBeNull();
  });
});
