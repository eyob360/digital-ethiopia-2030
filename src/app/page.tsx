import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-lg py-xl text-foreground">
      <section className="mx-auto flex max-w-5xl flex-col gap-lg">
        <div className="flex flex-col gap-sm">
          <p className="text-label font-semibold uppercase text-primary">Foundation scaffold</p>
          <h1 className="text-heading font-semibold">
            Digital Ethiopia 2030 Intelligence Dashboard
          </h1>
          <p className="max-w-2xl text-body">
            The application shell is ready for the approved MVP work orders: data/auth,
            deterministic pipeline rules, dashboard APIs, dashboard UI, and n8n ingestion.
          </p>
        </div>
        <div>
          <Button>Dashboard scaffold</Button>
        </div>
      </section>
    </main>
  );
}
