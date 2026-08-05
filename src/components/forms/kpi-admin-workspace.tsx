"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type KpiDefinition = {
  id: string;
  name: string;
  description: string;
  expectedUnit: string;
  targetValue: string | null;
  category: string;
  sourceUrls: string[];
  fetchIntervalHours: number;
};

type KpiAdminWorkspaceProps = {
  initialKpis: KpiDefinition[];
};

const emptyForm = {
  id: "",
  name: "",
  description: "",
  expectedUnit: "",
  targetValue: "",
  category: "",
  sourceUrls: "",
  fetchIntervalHours: "24",
};

export function KpiAdminWorkspace({ initialKpis }: KpiAdminWorkspaceProps) {
  const [kpis, setKpis] = useState(initialKpis);
  const [selectedId, setSelectedId] = useState(initialKpis[0]?.id ?? "");
  const [form, setForm] = useState(() => toForm(initialKpis[0]));
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedKpi = useMemo(
    () => kpis.find((kpi) => kpi.id === selectedId) ?? null,
    [kpis, selectedId],
  );

  function selectKpi(kpi: KpiDefinition) {
    setSelectedId(kpi.id);
    setForm(toForm(kpi));
    setStatus(null);
  }

  function startCreate() {
    setSelectedId("");
    setForm(emptyForm);
    setStatus(null);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const payload = {
      name: form.name,
      description: form.description,
      expectedUnit: form.expectedUnit,
      targetValue: form.targetValue,
      category: form.category,
      sourceUrls: form.sourceUrls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
      fetchIntervalHours: Number(form.fetchIntervalHours),
    };
    const response = await fetch(selectedId ? `/api/kpis/${selectedId}` : "/api/kpis", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: selectedId ? "PUT" : "POST",
    });
    const body = (await response.json().catch(() => null)) as { kpi?: KpiDefinition } | null;
    setSubmitting(false);

    if (!response.ok || !body?.kpi) {
      setStatus("The KPI definition could not be saved. Check required fields and try again.");
      return;
    }

    const saved = body.kpi;
    setKpis((current) =>
      current.some((kpi) => kpi.id === saved.id)
        ? current.map((kpi) => (kpi.id === saved.id ? saved : kpi))
        : [...current, saved].sort((left, right) => left.name.localeCompare(right.name)),
    );
    setSelectedId(saved.id);
    setForm(toForm(saved));
    setStatus("KPI definition saved.");
  }

  return (
    <section className="grid gap-md lg:grid-cols-[minmax(16rem,22rem)_1fr]" aria-label="KPI admin">
      <aside className="card flex flex-col gap-md">
        <div className="flex items-center justify-between gap-sm">
          <h2 className="text-lg font-semibold">Definitions</h2>
          <Button onClick={startCreate} variant="secondary">
            New
          </Button>
        </div>
        <div className="flex max-h-[36rem] flex-col gap-sm overflow-y-auto pr-xs">
          {kpis.map((kpi) => (
            <button
              aria-pressed={selectedId === kpi.id}
              className="list-button"
              key={kpi.id}
              onClick={() => selectKpi(kpi)}
              type="button"
            >
              <span className="font-semibold">{kpi.name}</span>
              <span className="text-sm text-foreground/65">{kpi.category}</span>
            </button>
          ))}
        </div>
      </aside>

      <form className="card grid gap-md" onSubmit={(event) => void submitForm(event)}>
        <div className="flex flex-col gap-xs">
          <p className="eyebrow">{selectedKpi ? "Edit definition" : "Create definition"}</p>
          <h2 className="text-xl font-semibold">{selectedKpi?.name ?? "New KPI"}</h2>
        </div>

        <div className="grid gap-md md:grid-cols-2">
          <label className="field-label">
            Name
            <input
              className="field-input"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              value={form.name}
            />
          </label>
          <label className="field-label">
            Category
            <input
              className="field-input"
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              required
              value={form.category}
            />
          </label>
          <label className="field-label">
            Expected unit
            <input
              className="field-input"
              onChange={(event) => setForm({ ...form, expectedUnit: event.target.value })}
              required
              value={form.expectedUnit}
            />
          </label>
          <label className="field-label">
            Target value
            <input
              className="field-input"
              inputMode="decimal"
              onChange={(event) => setForm({ ...form, targetValue: event.target.value })}
              value={form.targetValue}
            />
          </label>
          <label className="field-label">
            Fetch interval hours
            <input
              className="field-input"
              min="1"
              onChange={(event) => setForm({ ...form, fetchIntervalHours: event.target.value })}
              required
              type="number"
              value={form.fetchIntervalHours}
            />
          </label>
        </div>

        <label className="field-label">
          Description
          <textarea
            className="field-input min-h-28"
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            required
            value={form.description}
          />
        </label>

        <label className="field-label">
          Source URLs
          <textarea
            className="field-input min-h-32"
            onChange={(event) => setForm({ ...form, sourceUrls: event.target.value })}
            value={form.sourceUrls}
          />
        </label>

        <div className="flex flex-col gap-sm sm:flex-row sm:items-center">
          <Button disabled={submitting} type="submit">
            {submitting ? "Saving..." : selectedId ? "Save changes" : "Create KPI"}
          </Button>
          {status ? <p className="text-sm text-foreground/70">{status}</p> : null}
        </div>
      </form>
    </section>
  );
}

function toForm(kpi: KpiDefinition | undefined) {
  if (!kpi) {
    return emptyForm;
  }

  return {
    id: kpi.id,
    name: kpi.name,
    description: kpi.description,
    expectedUnit: kpi.expectedUnit,
    targetValue: kpi.targetValue ?? "",
    category: kpi.category,
    sourceUrls: kpi.sourceUrls.join("\n"),
    fetchIntervalHours: String(kpi.fetchIntervalHours),
  };
}
