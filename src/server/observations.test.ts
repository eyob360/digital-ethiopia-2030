import { describe, expect, it, vi } from "vitest";
import { appendAcceptedObservation, parseObservationInput } from "./observations";

describe("observation services", () => {
  it("parses observation input and requires storage fields", () => {
    expect(
      parseObservationInput({
        kpiId: "kpi-1",
        value: "12%",
        unit: "%",
        observedDate: "2026-08-05",
        sourceUrl: "https://digitalethiopia.tech",
        aiConfidence: 0.9,
      }),
    ).toMatchObject({ kpiId: "kpi-1", sourceUrl: "https://digitalethiopia.tech" });

    expect(parseObservationInput({ value: 12 })).toBeNull();
  });

  it("appends accepted observations as new rows without overwriting existing rows", async () => {
    // In-memory table backing a full mutating surface: if the implementation
    // ever switches to update/upsert/delete semantics, the mock mutates the
    // table exactly as a database would and the final-state assertions fail.
    const createdAt = new Date("2026-08-05T12:00:00.000Z");
    type Row = { id: string; kpiId: string; value: unknown; [key: string]: unknown };
    const rows: Row[] = [];
    const matches = (row: Row, where: Record<string, unknown> | undefined) =>
      Object.entries(where ?? {}).every(([key, expected]) => row[key] === expected);

    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const row = {
        id: `obs-${rows.length + 1}`,
        rawDocumentId: null,
        createdAt,
        ...data,
      } as unknown as Row;
      rows.push(row);
      return row;
    });
    const update = vi.fn(async ({ where, data }: { where: Row; data: Record<string, unknown> }) => {
      const row = rows.find((candidate) => matches(candidate, where));
      if (row) {
        Object.assign(row, data);
      }
      return row ?? null;
    });
    const updateMany = vi.fn(
      async ({ where, data }: { where: Row; data: Record<string, unknown> }) => {
        const matched = rows.filter((candidate) => matches(candidate, where));
        for (const row of matched) {
          Object.assign(row, data);
        }
        return { count: matched.length };
      },
    );
    const upsert = vi.fn(
      async ({
        where,
        update: updateData,
        create: createData,
      }: {
        where: Row;
        update: Record<string, unknown>;
        create: Record<string, unknown>;
      }) => {
        const row = rows.find((candidate) => matches(candidate, where));
        if (row) {
          Object.assign(row, updateData);
          return row;
        }
        return create({ data: createData });
      },
    );
    const deleteOne = vi.fn(async ({ where }: { where: Row }) => {
      const index = rows.findIndex((candidate) => matches(candidate, where));
      return index === -1 ? null : rows.splice(index, 1)[0];
    });
    const deleteMany = vi.fn(async ({ where }: { where?: Row } = {}) => {
      const matched = rows.filter((candidate) => matches(candidate, where));
      for (const row of matched) {
        rows.splice(rows.indexOf(row), 1);
      }
      return { count: matched.length };
    });

    const client = {
      kpiObservation: {
        create,
        update,
        updateMany,
        upsert,
        delete: deleteOne,
        deleteMany,
      },
    };
    const input = {
      kpiId: "kpi-1",
      value: "12%",
      unit: "%",
      observedDate: "2026-08-05",
      sourceUrl: "https://digitalethiopia.tech",
      aiConfidence: 0.9,
    };

    const first = await appendAcceptedObservation(input, client as never);
    const second = await appendAcceptedObservation({ ...input, value: "13%" }, client as never);

    expect(first).toMatchObject({ status: "inserted", observation: { value: "12" } });
    expect(second).toMatchObject({ status: "inserted", observation: { value: "13" } });

    // Both rows exist and the first row kept its original value: no overwrite.
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: "obs-1", kpiId: "kpi-1", value: 12 });
    expect(rows[1]).toMatchObject({ id: "obs-2", kpiId: "kpi-1", value: 13 });
    expect(rows[0].id).not.toBe(rows[1].id);

    expect(update).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(deleteOne).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("sets review flags from confidence thresholds and rejects low-confidence rows", async () => {
    const createdAt = new Date("2026-08-05T12:00:00.000Z");
    const create = vi.fn(async ({ data }) => ({
      id: "obs-1",
      rawDocumentId: null,
      createdAt,
      ...data,
    }));
    const client = { kpiObservation: { create } };
    const baseInput = {
      kpiId: "kpi-1",
      value: 12,
      unit: "percent",
      observedDate: "2026-08-05",
      sourceUrl: "https://digitalethiopia.tech",
    };

    await expect(
      appendAcceptedObservation({ ...baseInput, aiConfidence: 0.84 }, client as never),
    ).resolves.toMatchObject({ status: "inserted", observation: { reviewFlag: true } });
    await expect(
      appendAcceptedObservation({ ...baseInput, aiConfidence: 0.59 }, client as never),
    ).resolves.toEqual({ status: "rejected", observation: null });

    expect(create).toHaveBeenCalledTimes(1);
  });
});
