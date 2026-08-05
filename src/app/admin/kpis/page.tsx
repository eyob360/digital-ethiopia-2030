import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { KpiAdminWorkspace } from "@/components/forms/kpi-admin-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { canUseOperatorControls } from "@/lib/auth/roles";
import { authOptions } from "@/server/auth";
import { listKpiDefinitions } from "@/server/kpis";

export const dynamic = "force-dynamic";

export default async function KpiAdminPage() {
  const [session, kpis] = await Promise.all([getServerSession(authOptions), listKpiDefinitions()]);

  if (!canUseOperatorControls(session?.user?.role)) {
    redirect("/");
  }

  return (
    <AppShell session={session}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Operator</p>
          <h1>KPI administration</h1>
          <p>
            Create, inspect, and edit controlled KPI definitions used by dashboard and pipeline
            APIs.
          </p>
        </div>
      </section>
      <KpiAdminWorkspace initialKpis={kpis} />
    </AppShell>
  );
}
