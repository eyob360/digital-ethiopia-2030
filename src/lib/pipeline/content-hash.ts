import { createHash } from "node:crypto";

export function createContentHash(rawText: string) {
  return createHash("sha256").update(rawText).digest("hex");
}

export function shouldStoreRawDocument(contentHash: string, existingHashes: ReadonlySet<string>) {
  return !existingHashes.has(contentHash);
}
