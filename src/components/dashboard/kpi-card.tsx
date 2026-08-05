import Link from "next/link";
import { StatusBadge } from "./status-badge";

type KpiCardProps = {
  kpi: {
    id: string;
    name: string;
    description: string;
    expectedUnit: string;
    category: string;
    latestObservation: {
      value: string;
      unit: string;
      region: string;
      observedDate: string;
      aiConfidence: string;
      reviewFlag: boolean;
    } | null;
    targetProgress: {
      percent: number;
      targetValue: string;
      unit: string;
    } | null;
  };
};

export function KpiCard({ kpi }: KpiCardProps) {
  const latest = kpi.latestObservation;
  const progress = kpi.targetProgress;

  return (
    <article className="card flex min-h-72 flex-col justify-between gap-md">
      <div className="flex flex-col gap-sm">
        <div className="flex flex-wrap items-center gap-sm">
          <StatusBadge>{kpi.category}</StatusBadge>
          {latest ? (
            <StatusBadge tone={latest.reviewFlag ? "warning" : "success"}>
              {latest.reviewFlag ? "Review flagged" : "Auto accepted"}
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">No observation</StatusBadge>
          )}
        </div>
        <h2 className="text-lg font-semibold">{kpi.name}</h2>
        <p className="line-clamp-3 text-sm text-foreground/70">{kpi.description}</p>
      </div>

      {latest ? (
        <div className="grid gap-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-foreground/60">Latest value</p>
            <p className="text-2xl font-semibold">
              {latest.value} <span className="text-base text-foreground/65">{latest.unit}</span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-sm text-sm">
            <div>
              <dt className="text-foreground/60">Region</dt>
              <dd className="font-medium">{latest.region}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">Observed</dt>
              <dd className="font-medium">{formatDate(latest.observedDate)}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">Confidence</dt>
              <dd className="font-medium">{formatPercent(Number(latest.aiConfidence) * 100)}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">Target</dt>
              <dd className="font-medium">
                {progress
                  ? `${formatPercent(progress.percent)} of ${progress.targetValue}`
                  : "None"}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="empty-state">Waiting for the first accepted observation.</div>
      )}

      <Link className="button-link button-secondary w-full" href={`/kpis/${kpi.id}`}>
        Open KPI detail
      </Link>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}
