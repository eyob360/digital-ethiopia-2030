import { describe, expect, it } from "vitest";
import { createContentHash, shouldStoreRawDocument } from "./content-hash";

describe("content hashing", () => {
  it("creates stable SHA256 hashes after whitespace normalization", () => {
    expect(createContentHash("Digital Ethiopia\n2030")).toBe(
      createContentHash(" Digital   Ethiopia 2030 "),
    );
    expect(createContentHash("Digital Ethiopia 2030")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("skips raw document storage for duplicate hashes", () => {
    const hash = createContentHash("same document");

    expect(shouldStoreRawDocument(hash, new Set())).toBe(true);
    expect(shouldStoreRawDocument(hash, new Set([hash]))).toBe(false);
  });
});
