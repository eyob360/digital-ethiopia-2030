import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardKpis, getKpiHistory } from "@/server/dashboard";
import { authOptions } from "@/server/auth";

export const dynamic = "force-dynamic";

type KpiDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function KpiDetailPage({ params }: KpiDetailPageProps) {
  const { id } = await params;
  const [session, kpis, history] = await Promise.all([
    getServerSession(authOptions),
    getDashboardKpis(),
    getKpiHistory(id),
  ]);
  const kpi = kpis.find((item) => item.id === id);

  if (!kpi) {
    notFound();
  }

  return (
    <AppShell session={session}>
      <div className="flex flex-col gap-sm">
        <Link className="subtle-link w-fit" href="/">
          Back to dashboard
        </Link>
        <section className="page-heading">
          <div>
            <p className="eyebrow">{kpi.category}</p>
            <h1>{kpi.name}</h1>
            <p>{kpi.description}</p>
          </div>
        </section>
      </div>

      <section className="grid gap-md lg:grid-cols-[1fr_2fr]" aria-label="KPI detail">
        <aside className="card flex flex-col gap-md">
          <div>
            <p className="text-sm font-medium text-foreground/65">Expected unit</p>
            <p className="text-xl font-semibold">{kpi.expectedUnit}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/65">Target value</p>
            <p className="text-xl font-semibold">
              {kpi.targetValue ? `${kpi.targetValue} ${kpi.expectedUnit}` : "No target"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/65">Fetch interval</p>
            <p className="text-xl font-semibold">{kpi.fetchIntervalHours} hours</p>
          </div>
          <div className="flex flex-col gap-sm">
            <p className="text-sm font-medium text-foreground/65">Source URLs</p>
            {kpi.sourceUrls.length ? (
              <ul className="flex flex-col gap-sm">
                {kpi.sourceUrls.map((url) => (
                  <li key={url}>
                    <a
                      className="subtle-link break-all"
                      href={url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground/65">No source URL configured.</p>
            )}
          </div>
        </aside>

        <section className="card overflow-hidden" aria-labelledby="history-heading">
          <div className="mb-md flex flex-col gap-xs">
            <h2 id="history-heading" className="text-xl font-semibold">
              Observation history
            </h2>
            <p className="text-sm text-foreground/65">
              Review-flagged values are visible only; approval and rejection are outside the MVP.
            </p>
          </div>
          {history.length ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Observed</th>
                    <th>Value</th>
                    <th>Region</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((observation) => (
                    <tr key={observation.id}>
                      <td>{formatDate(observation.observedDate)}</td>
                      <td>
                        {observation.value} {observation.unit}
                      </td>
                      <td>{observation.region}</td>
                      <td>{formatPercent(Number(observation.aiConfidence) * 100)}</td>
                      <td>
                        <StatusBadge tone={observation.reviewFlag ? "warning" : "success"}>
                          {observation.reviewFlag ? "Review flagged" : "Auto accepted"}
                        </StatusBadge>
                      </td>
                      <td>
                        <a
                          className="subtle-link break-all"
                          href={observation.sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Source
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No observations have been accepted for this KPI yet.</div>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}
