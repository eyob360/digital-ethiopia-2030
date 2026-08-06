"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type UrlFilterConfigWorkspaceProps = {
  initialConfig: {
    blockedDomains: string[];
    allowedDomains: string[];
    updatedAt: string | null;
  };
  defaultBlockedDomainCategories: Record<string, readonly string[]>;
};

export function UrlFilterConfigWorkspace({
  initialConfig,
  defaultBlockedDomainCategories,
}: UrlFilterConfigWorkspaceProps) {
  const [blockedDomains, setBlockedDomains] = useState(initialConfig.blockedDomains.join("\n"));
  const [allowedDomains, setAllowedDomains] = useState(initialConfig.allowedDomains.join("\n"));
  const [updatedAt, setUpdatedAt] = useState(initialConfig.updatedAt);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/url-filter-config", {
      body: JSON.stringify({
        blockedDomains: toDomainList(blockedDomains),
        allowedDomains: toDomainList(allowedDomains),
      }),
      headers: { "content-type": "application/json" },
      method: "PUT",
    });
    const body = (await response.json().catch(() => null)) as {
      config?: { blockedDomains: string[]; allowedDomains: string[]; updatedAt: string | null };
    } | null;
    setSubmitting(false);

    if (!response.ok || !body?.config) {
      setStatus(
        "The configuration could not be saved. Check that every line is a valid domain (for example itu.int) and try again.",
      );
      return;
    }

    setBlockedDomains(body.config.blockedDomains.join("\n"));
    setAllowedDomains(body.config.allowedDomains.join("\n"));
    setUpdatedAt(body.config.updatedAt);
    setStatus("URL filter configuration saved. The pipeline applies it on its next run.");
  }

  return (
    <section
      className="grid gap-md lg:grid-cols-[minmax(16rem,24rem)_1fr]"
      aria-label="URL filter configuration"
    >
      <aside className="card flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <h2 className="text-lg font-semibold">Blocked by default</h2>
          <p className="text-sm text-foreground/70">
            These categories are always blocked unless a domain is listed under always-allowed
            domains. Every other domain passes by default.
          </p>
        </div>
        <div className="flex max-h-[36rem] flex-col gap-md overflow-y-auto pr-xs">
          {Object.entries(defaultBlockedDomainCategories).map(([category, domains]) => (
            <div className="flex flex-col gap-xs" key={category}>
              <h3 className="text-sm font-semibold uppercase text-foreground/80">
                {category.replaceAll("-", " ")}
              </h3>
              <p className="text-sm text-foreground/65">{domains.join(", ")}</p>
            </div>
          ))}
        </div>
      </aside>

      <form className="card grid gap-md" onSubmit={(event) => void submitForm(event)}>
        <div className="flex flex-col gap-xs">
          <p className="eyebrow">Operator overrides</p>
          <h2 className="text-xl font-semibold">Blocked and allowed domains</h2>
          <p className="text-sm text-foreground/70">
            One domain per line (for example itu.int). Changes take effect on the next pipeline run
            — no code change or redeploy needed.
          </p>
        </div>

        <label className="field-label">
          Additional blocked domains
          <textarea
            className="field-input min-h-32"
            onChange={(event) => setBlockedDomains(event.target.value)}
            value={blockedDomains}
          />
        </label>

        <label className="field-label">
          Always-allowed domains (win over every block rule)
          <textarea
            className="field-input min-h-32"
            onChange={(event) => setAllowedDomains(event.target.value)}
            value={allowedDomains}
          />
        </label>

        <div className="flex flex-col gap-sm sm:flex-row sm:items-center">
          <Button disabled={submitting} type="submit">
            {submitting ? "Saving..." : "Save configuration"}
          </Button>
          {status ? <p className="text-sm text-foreground/70">{status}</p> : null}
        </div>
        {updatedAt ? (
          <p className="text-sm text-foreground/65">
            Last updated {new Date(updatedAt).toLocaleString()}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function toDomainList(value: string) {
  return value
    .split("\n")
    .map((domain) => domain.trim())
    .filter(Boolean);
}
