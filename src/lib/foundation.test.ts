import { describe, expect, it } from "vitest";

describe("foundation", () => {
  it("runs the test harness", () => {
    expect("Digital Ethiopia 2030").toContain("Ethiopia");
  });
});
