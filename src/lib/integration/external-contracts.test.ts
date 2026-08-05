import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseOpenAiExtraction,
  parseOpenAiQueryGeneration,
  parseOpenAiRelevance,
  parseTavilySearchResponse,
} from "./external-contracts";

const rootDir = process.cwd();

describe("external integration contracts", () => {
  it("accepts the checked-in OpenAI and Tavily success mocks", () => {
    expect(parseOpenAiQueryGeneration(readJson("n8n/mocks/openai-query-generation.json"))).toEqual({
      queries: expect.arrayContaining([expect.any(String)]),
    });
    expect(parseOpenAiRelevance(readJson("n8n/mocks/openai-relevance.json"))).toEqual({
      confidence: expect.any(Number),
      relevant: expect.any(Boolean),
    });
    expect(parseOpenAiExtraction(readJson("n8n/mocks/openai-extraction.json"))).toEqual({
      confidence: expect.any(Number),
      explanation: expect.any(String),
      observed_date: expect.any(String),
      region: expect.any(String),
      unit: expect.any(String),
      value_numeric: expect.any(Number),
    });
    expect(parseTavilySearchResponse(readJson("n8n/mocks/tavily-search.json"))).toEqual({
      results: expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String),
          url: expect.stringMatching(/^https?:\/\//),
        }),
      ]),
    });
  });

  it("rejects invalid OpenAI response shapes without live credentials", () => {
    expect(parseOpenAiQueryGeneration({ queries: ["", 5] })).toBeNull();
    expect(parseOpenAiRelevance({ confidence: 1.2, relevant: true })).toBeNull();
    expect(parseOpenAiRelevance({ confidence: 0.8, relevant: "yes" })).toBeNull();
    expect(
      parseOpenAiExtraction({
        confidence: 0.9,
        explanation: "Missing value",
        observed_date: "2026-08-05",
        region: "Ethiopia",
        unit: "percent",
      }),
    ).toBeNull();
    expect(
      parseOpenAiExtraction({
        confidence: 0.9,
        explanation: "Bad date",
        observed_date: "August 5, 2026",
        region: "Ethiopia",
        unit: "percent",
        value_numeric: 42,
      }),
    ).toBeNull();
  });

  it("rejects invalid Tavily response shapes and drops malformed result rows", () => {
    expect(parseTavilySearchResponse({})).toBeNull();
    expect(
      parseTavilySearchResponse({ results: [{ title: "Bad", url: "ftp://example.com" }] }),
    ).toBeNull();
    expect(
      parseTavilySearchResponse({
        results: [
          { title: "", url: "https://example.com/empty-title" },
          { title: "Good", url: "https://example.com/good", content: " Context " },
        ],
      }),
    ).toEqual({
      results: [{ title: "Good", url: "https://example.com/good", content: "Context" }],
    });
  });
});

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(join(rootDir, path), "utf8"));
}
