import { getServerSession } from "next-auth";
import { AccountActions } from "@/components/forms/account-actions";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  return (
    <AppShell session={session}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Session basics</h1>
          <p>Current sign-in details and basic session control.</p>
        </div>
      </section>
      <section className="card max-w-2xl">
        <dl className="grid gap-md sm:grid-cols-2">
          <div>
            <dt className="text-sm text-foreground/65">Name</dt>
            <dd className="font-semibold">{session?.user?.name ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/65">Email</dt>
            <dd className="font-semibold">{session?.user?.email ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/65">Role</dt>
            <dd className="font-semibold">{session?.user?.role ?? "VIEWER"}</dd>
          </div>
        </dl>
        <div className="mt-lg">
          <AccountActions />
        </div>
      </section>
    </AppShell>
  );
}
