import { describe, expect, it } from "vitest";
import { parseRawDocumentInput, storeRawDocumentIfNew } from "./raw-documents";

describe("raw document ingestion service", () => {
  it("stores new raw documents with a SHA256 content hash", async () => {
    const created: unknown[] = [];
    const client = {
      rawDocument: {
        findUnique: async () => null,
        create: async ({
          data,
        }: {
          data: { sourceUrl: string; rawText: string; contentHash: string };
        }) => {
          created.push(data);
          return {
            id: "raw-1",
            createdAt: new Date("2026-08-05T00:00:00Z"),
            ...data,
          };
        },
      },
    };

    const result = await storeRawDocumentIfNew(
      { rawText: "Readable source text", sourceUrl: "https://statsethiopia.gov.et/report" },
      client as never,
    );

    expect(result.status).toBe("stored");
    expect(result.rawDocument.id).toBe("raw-1");
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(created).toHaveLength(1);
  });

  it("returns duplicate without creating another row", async () => {
    const existing = {
      id: "raw-existing",
      sourceUrl: "https://worldbank.org/report",
      rawText: "Duplicate source text",
      contentHash: "known-hash",
      createdAt: new Date("2026-08-05T00:00:00Z"),
    };
    const client = {
      rawDocument: {
        findUnique: async () => existing,
        create: async () => {
          throw new Error("duplicate raw document should not be created");
        },
      },
    };

    const result = await storeRawDocumentIfNew(
      { rawText: "Duplicate source text", sourceUrl: "https://worldbank.org/report" },
      client as never,
    );

    expect(result.status).toBe("duplicate");
    expect(result.rawDocument.id).toBe("raw-existing");
  });

  it("parses required raw document input fields", () => {
    expect(
      parseRawDocumentInput({ rawText: " text ", sourceUrl: " https://example.com " }),
    ).toEqual({
      rawText: "text",
      sourceUrl: "https://example.com",
    });
    expect(parseRawDocumentInput({ rawText: "", sourceUrl: "https://example.com" })).toBeNull();
  });
});
