import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { authOptions } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-md py-xl text-foreground">
      <section className="card w-full max-w-md">
        <div className="mb-lg flex flex-col gap-sm">
          <p className="eyebrow">Digital Ethiopia 2030</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-foreground/65">
            Use your dashboard account to view KPIs or manage operator workflows.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
