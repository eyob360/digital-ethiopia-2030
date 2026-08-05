import Link from "next/link";
import type { Session } from "next-auth";
import { canUseOperatorControls } from "@/lib/auth/roles";

type AppShellProps = {
  children: React.ReactNode;
  session: Session | null;
};

const viewerLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/account", label: "Account" },
];

const operatorLinks = [
  { href: "/admin/kpis", label: "KPI Admin" },
  { href: "/pipeline", label: "Pipeline" },
];

export function AppShell({ children, session }: AppShellProps) {
  const role = session?.user?.role;
  const links = canUseOperatorControls(role) ? [...viewerLinks, ...operatorLinks] : viewerLinks;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-md px-md py-md sm:px-lg lg:flex-row lg:items-center lg:justify-between">
          <Link className="focus-ring w-fit" href="/">
            <span className="block text-label font-semibold uppercase text-primary">
              Digital Ethiopia 2030
            </span>
            <span className="block text-xl font-semibold">Intelligence Dashboard</span>
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-sm">
            {links.map((link) => (
              <Link className="nav-link" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="text-sm text-foreground/70">
            <span className="font-medium text-foreground">{session?.user?.name ?? "User"}</span>
            <span> · {role ?? "VIEWER"}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-lg px-md py-lg sm:px-lg">
        {children}
      </main>
    </div>
  );
}
