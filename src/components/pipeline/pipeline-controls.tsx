"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";

type PipelineLock = {
  name: string;
  locked: boolean;
  lockedAt: string | null;
  updatedAt: string;
};

type EligibleKpi = {
  id: string;
  name: string;
  category: string;
  fetchIntervalHours: number;
};

type PipelineControlsProps = {
  initialLock: PipelineLock;
  initialEligibleKpis: EligibleKpi[];
};

export function PipelineControls({ initialEligibleKpis, initialLock }: PipelineControlsProps) {
  const [lock, setLock] = useState(initialLock);
  const [eligibleKpis, setEligibleKpis] = useState(initialEligibleKpis);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function sendAction(endpoint: "/api/pipeline/lock" | "/api/pipeline/runs", action: string) {
    setSubmitting(true);
    setMessage(null);
    const response = await fetch(endpoint, {
      body: JSON.stringify({ action }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as {
      lock?: PipelineLock;
      kpis?: EligibleKpi[];
      started?: boolean;
      acquired?: boolean;
    } | null;
    setSubmitting(false);

    if (!response.ok || !body) {
      setMessage("Pipeline action failed.");
      return;
    }

    if (body.lock) {
      setLock(body.lock);
    }

    if (body.kpis) {
      setEligibleKpis(body.kpis);
    }

    if (action === "start") {
      setMessage(
        body.started ? "Pipeline run started and lock acquired." : "Pipeline is already locked.",
      );
      return;
    }

    setMessage(`Pipeline ${action} completed.`);
  }

  return (
    <section className="grid gap-md lg:grid-cols-[minmax(18rem,24rem)_1fr]">
      <aside className="card flex flex-col gap-md">
        <div>
          <p className="text-sm font-medium text-foreground/65">Lock</p>
          <div className="mt-sm">
            <StatusBadge tone={lock.locked ? "warning" : "success"}>
              {lock.locked ? "Locked" : "Available"}
            </StatusBadge>
          </div>
        </div>
        <dl className="grid gap-sm text-sm">
          <div>
            <dt className="text-foreground/65">Name</dt>
            <dd className="font-semibold">{lock.name}</dd>
          </div>
          <div>
            <dt className="text-foreground/65">Locked at</dt>
            <dd className="font-semibold">
              {lock.lockedAt ? formatDateTime(lock.lockedAt) : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/65">Updated</dt>
            <dd className="font-semibold">{formatDateTime(lock.updatedAt)}</dd>
          </div>
        </dl>
        <div className="grid gap-sm">
          <Button
            disabled={submitting}
            onClick={() => void sendAction("/api/pipeline/runs", "start")}
          >
            Start run
          </Button>
          <Button
            disabled={submitting}
            onClick={() => void sendAction("/api/pipeline/runs", "complete")}
            variant="secondary"
          >
            Complete run
          </Button>
          <Button
            disabled={submitting}
            onClick={() => void sendAction("/api/pipeline/lock", "release")}
            variant="secondary"
          >
            Release lock
          </Button>
        </div>
        {message ? <p className="text-sm text-foreground/70">{message}</p> : null}
      </aside>

      <section className="card" aria-labelledby="eligible-heading">
        <div className="mb-md flex flex-col gap-xs">
          <h2 id="eligible-heading" className="text-xl font-semibold">
            Eligible KPI batch
          </h2>
          <p className="text-sm text-foreground/65">
            The pipeline loads no more than 10 currently eligible KPI definitions.
          </p>
        </div>
        {eligibleKpis.length ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Interval</th>
                </tr>
              </thead>
              <tbody>
                {eligibleKpis.map((kpi) => (
                  <tr key={kpi.id}>
                    <td>{kpi.name}</td>
                    <td>{kpi.category}</td>
                    <td>{kpi.fetchIntervalHours} hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No KPI definitions are currently eligible.</div>
        )}
      </section>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
