import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/app-shell";
import { CategoryFilter } from "@/components/dashboard/category-filter";
import { getDashboardKpis } from "@/server/dashboard";
import { authOptions } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [session, kpis] = await Promise.all([getServerSession(authOptions), getDashboardKpis()]);
  const observedCount = kpis.filter((kpi) => kpi.latestObservation).length;
  const reviewCount = kpis.filter((kpi) => kpi.latestObservation?.reviewFlag).length;
  const categoryCount = new Set(kpis.map((kpi) => kpi.category)).size;

  return (
    <AppShell session={session}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Dashboard overview</p>
          <h1>Digital Ethiopia 2030 KPIs</h1>
          <p>
            Latest accepted observations grouped by Digital Ethiopia 2030 priority area, with
            server-calculated progress and review status.
          </p>
        </div>
      </section>

      <section className="grid gap-md md:grid-cols-3" aria-label="Dashboard summary">
        <SummaryStat label="Configured KPIs" value={kpis.length} />
        <SummaryStat label="Categories" value={categoryCount} />
        <SummaryStat
          label="Review flagged"
          value={reviewCount}
          detail={`${observedCount} observed`}
        />
      </section>

      <CategoryFilter kpis={kpis} />
    </AppShell>
  );
}

function SummaryStat({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="metric-panel">
      <p className="text-sm font-medium text-foreground/65">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {detail ? <p className="text-sm text-foreground/65">{detail}</p> : null}
    </div>
  );
}
