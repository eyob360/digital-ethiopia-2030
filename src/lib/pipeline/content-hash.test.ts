import { describe, expect, it } from "vitest";
import { createContentHash, shouldStoreRawDocument } from "./content-hash";

describe("content hashing", () => {
  it("creates stable SHA256 hashes for raw text", () => {
    expect(createContentHash("Digital Ethiopia 2030")).toBe(
      "6970133b55e43abc67e8d5c5b5bf6b4ac01dbce48ed07440501bd3c9e9d46357",
    );
    expect(createContentHash("Digital Ethiopia\n2030")).not.toBe(
      createContentHash("Digital Ethiopia 2030"),
    );
  });

  it("skips raw document storage for duplicate hashes", () => {
    const hash = createContentHash("same document");

    expect(shouldStoreRawDocument(hash, new Set())).toBe(true);
    expect(shouldStoreRawDocument(hash, new Set([hash]))).toBe(false);
  });
});
