import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PipelineControls } from "@/components/pipeline/pipeline-controls";
import { AppShell } from "@/components/layout/app-shell";
import { canUseOperatorControls } from "@/lib/auth/roles";
import { authOptions } from "@/server/auth";
import { loadEligibleKpisForPipeline } from "@/server/kpis";
import { getPipelineLockStatus } from "@/server/pipeline";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [session, lock, eligibleKpis] = await Promise.all([
    getServerSession(authOptions),
    getPipelineLockStatus(),
    loadEligibleKpisForPipeline(),
  ]);

  if (!canUseOperatorControls(session?.user?.role)) {
    redirect("/");
  }

  return (
    <AppShell session={session}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Operator</p>
          <h1>Pipeline status</h1>
          <p>Monitor ingestion lock state and the current eligible KPI batch.</p>
        </div>
      </section>
      <PipelineControls initialEligibleKpis={eligibleKpis} initialLock={lock} />
    </AppShell>
  );
}
