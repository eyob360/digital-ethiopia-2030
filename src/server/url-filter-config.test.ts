import { describe, expect, it } from "vitest";
import {
  getUrlFilterConfig,
  parseUrlFilterConfigInput,
  updateUrlFilterConfig,
} from "./url-filter-config";

describe("parseUrlFilterConfigInput", () => {
  it("normalizes pasted URLs and hostnames into deduplicated domain lists", () => {
    expect(
      parseUrlFilterConfigInput({
        blockedDomains: ["https://www.Example-Farm.com/some/path", "example-farm.com", ""],
        allowedDomains: [" itu.int ", "https://ecc.gov.et/licensing?x=1"],
      }),
    ).toEqual({
      blockedDomains: ["example-farm.com"],
      allowedDomains: ["itu.int", "ecc.gov.et"],
    });
  });

  it("treats missing lists as empty", () => {
    expect(parseUrlFilterConfigInput({})).toEqual({ blockedDomains: [], allowedDomains: [] });
  });

  it("rejects payloads that are not objects or contain invalid entries", () => {
    expect(parseUrlFilterConfigInput(null)).toBeNull();
    expect(parseUrlFilterConfigInput({ blockedDomains: "facebook.com" })).toBeNull();
    expect(parseUrlFilterConfigInput({ blockedDomains: [42] })).toBeNull();
    expect(parseUrlFilterConfigInput({ allowedDomains: ["not a domain"] })).toBeNull();
    expect(parseUrlFilterConfigInput({ allowedDomains: ["nodots"] })).toBeNull();
  });
});

describe("url filter config service", () => {
  it("returns empty override lists when no configuration row exists", async () => {
    const client = {
      urlFilterConfig: {
        findUnique: async () => null,
      },
    };

    await expect(getUrlFilterConfig(client as never)).resolves.toEqual({
      blockedDomains: [],
      allowedDomains: [],
      updatedAt: null,
    });
  });

  it("reads the stored operator override lists", async () => {
    const client = {
      urlFilterConfig: {
        findUnique: async ({ where }: { where: { id: string } }) => ({
          id: where.id,
          blockedDomains: ["example-farm.com"],
          allowedDomains: ["medium.com"],
          updatedAt: new Date("2026-08-06T00:00:00Z"),
        }),
      },
    };

    await expect(getUrlFilterConfig(client as never)).resolves.toEqual({
      blockedDomains: ["example-farm.com"],
      allowedDomains: ["medium.com"],
      updatedAt: "2026-08-06T00:00:00.000Z",
    });
  });

  it("upserts the singleton configuration row on update", async () => {
    const calls: unknown[] = [];
    const client = {
      urlFilterConfig: {
        upsert: async (args: {
          where: { id: string };
          create: { id: string; blockedDomains: string[]; allowedDomains: string[] };
          update: { blockedDomains: string[]; allowedDomains: string[] };
        }) => {
          calls.push(args);
          return {
            ...args.create,
            updatedAt: new Date("2026-08-06T12:00:00Z"),
          };
        },
      },
    };

    const result = await updateUrlFilterConfig(
      { blockedDomains: ["example-farm.com"], allowedDomains: ["itu.int"] },
      client as never,
    );

    expect(result).toEqual({
      blockedDomains: ["example-farm.com"],
      allowedDomains: ["itu.int"],
      updatedAt: "2026-08-06T12:00:00.000Z",
    });
    expect(calls).toEqual([
      {
        where: { id: "default" },
        create: {
          id: "default",
          blockedDomains: ["example-farm.com"],
          allowedDomains: ["itu.int"],
        },
        update: { blockedDomains: ["example-farm.com"], allowedDomains: ["itu.int"] },
      },
    ]);
  });
});
