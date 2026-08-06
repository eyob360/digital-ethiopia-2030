import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { UrlFilterConfigWorkspace } from "@/components/forms/url-filter-config-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { canUseOperatorControls } from "@/lib/auth/roles";
import { defaultBlockedDomainCategories } from "@/lib/pipeline";
import { authOptions } from "@/server/auth";
import { getUrlFilterConfig } from "@/server/url-filter-config";

export const dynamic = "force-dynamic";

export default async function UrlFilterAdminPage() {
  const [session, config] = await Promise.all([
    getServerSession(authOptions),
    getUrlFilterConfig(),
  ]);

  if (!canUseOperatorControls(session?.user?.role)) {
    redirect("/");
  }

  return (
    <AppShell session={session}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Operator</p>
          <h1>URL filtering</h1>
          <p>
            Control which domains the ingestion pipeline may fetch. Default category blocking
            applies first; your overrides below win without a code change.
          </p>
        </div>
      </section>
      <UrlFilterConfigWorkspace
        defaultBlockedDomainCategories={
          defaultBlockedDomainCategories as Record<string, readonly string[]>
        }
        initialConfig={config}
      />
    </AppShell>
  );
}
