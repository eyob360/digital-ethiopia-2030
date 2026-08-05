import { describe, expect, it } from "vitest";
import { createPasswordHash, verifyPassword } from "./password";

describe("password helpers", () => {
  it("verifies a matching password", async () => {
    const hash = await createPasswordHash("correct horse battery staple");

    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await createPasswordHash("correct horse battery staple");

    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("rejects missing and malformed hashes", async () => {
    await expect(verifyPassword("password", null)).resolves.toBe(false);
    await expect(verifyPassword("password", "plain-text")).resolves.toBe(false);
  });
});
