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
      pipelineLock: {
        updateMany: async () => ({ count: 1 }),
      },
    };

    const result = await storeRawDocumentIfNew(
      {
        rawText: "Readable source text",
        sourceUrl: "https://statsethiopia.gov.et/report",
        workflowContext: {
          runId: "run-1",
          branchKey: "kpi-1",
          kpi: { id: "kpi-1", name: "Access" },
        },
      },
      client as never,
    );

    expect(result.status).toBe("stored");
    if (result.status !== "stored") {
      throw new Error("expected stored raw document");
    }
    expect(result.rawDocument.id).toBe("raw-1");
    expect(result.runId).toBe("run-1");
    expect(result.branchKey).toBe("kpi-1");
    expect(result.kpi).toEqual({ id: "kpi-1", name: "Access" });
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
      pipelineLock: {
        updateMany: async () => ({ count: 1 }),
      },
    };

    const result = await storeRawDocumentIfNew(
      { rawText: "Duplicate source text", sourceUrl: "https://worldbank.org/report" },
      client as never,
    );

    expect(result.status).toBe("duplicate");
    if (result.status !== "duplicate") {
      throw new Error("expected duplicate raw document");
    }
    expect(result.rawDocument.id).toBe("raw-existing");
  });

  it("returns budget exhausted before hashing or storing when the run cap is reached", async () => {
    const client = {
      rawDocument: {
        findUnique: async () => {
          throw new Error("budget-exhausted documents should not be hashed or looked up");
        },
        create: async () => {
          throw new Error("budget-exhausted documents should not be created");
        },
      },
      pipelineLock: {
        updateMany: async () => ({ count: 0 }),
      },
    };

    await expect(
      storeRawDocumentIfNew(
        { rawText: "Beyond budget", sourceUrl: "https://example.com/report" },
        client as never,
      ),
    ).resolves.toEqual({
      status: "budget_exhausted",
      rawDocument: null,
      contentHash: null,
    });
  });

  it("parses required raw document input fields", () => {
    expect(
      parseRawDocumentInput({
        rawText: " text ",
        sourceUrl: " https://example.com ",
        runId: "run-1",
        branchKey: "kpi-1",
      }),
    ).toEqual({
      rawText: "text",
      sourceUrl: "https://example.com",
      workflowContext: {
        runId: "run-1",
        branchKey: "kpi-1",
      },
    });
    expect(parseRawDocumentInput({ rawText: "", sourceUrl: "https://example.com" })).toBeNull();
  });
});
