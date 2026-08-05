import { describe, expect, it } from "vitest";
import { assertKnownRole, canUseOperatorControls, canViewDashboard } from "./roles";

describe("role helpers", () => {
  it("allows operators and viewers to view dashboard data", () => {
    expect(canViewDashboard("OPERATOR")).toBe(true);
    expect(canViewDashboard("VIEWER")).toBe(true);
  });

  it("limits operator controls to operators", () => {
    expect(canUseOperatorControls("OPERATOR")).toBe(true);
    expect(canUseOperatorControls("VIEWER")).toBe(false);
    expect(canUseOperatorControls(null)).toBe(false);
  });

  it("rejects unknown roles", () => {
    expect(() => assertKnownRole("ADMIN")).toThrow("Unknown user role");
  });
});
