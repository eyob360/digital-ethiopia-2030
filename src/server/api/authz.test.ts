import { describe, expect, it } from "vitest";
import { authorizeRole } from "./authz";

describe("authorizeRole", () => {
  it("denies unauthenticated access", () => {
    expect(authorizeRole(null, "VIEWER").ok).toBe(false);
  });

  it("allows viewers to read dashboard data", () => {
    expect(authorizeRole("VIEWER", "VIEWER")).toEqual({ ok: true, role: "VIEWER" });
  });

  it("denies viewers operator access", () => {
    const result = authorizeRole("VIEWER", "OPERATOR");

    expect(result.ok).toBe(false);
  });

  it("allows operators to use protected admin and pipeline APIs", () => {
    expect(authorizeRole("OPERATOR", "OPERATOR")).toEqual({ ok: true, role: "OPERATOR" });
  });
});
