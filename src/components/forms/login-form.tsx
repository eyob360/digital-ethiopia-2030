"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      callbackUrl,
      redirect: false,
    });

    setSubmitting(false);

    if (!result || result.error) {
      setError("Email or password did not match an active account.");
      return;
    }

    window.location.assign(result.url ?? callbackUrl);
  }

  return (
    <form className="flex flex-col gap-md" onSubmit={(event) => void onSubmit(event)}>
      <label className="field-label">
        Email
        <input autoComplete="email" className="field-input" name="email" required type="email" />
      </label>
      <label className="field-label">
        Password
        <input
          autoComplete="current-password"
          className="field-input"
          name="password"
          required
          type="password"
        />
      </label>
      {error ? (
        <p className="rounded-sm border border-danger/30 bg-danger/10 px-sm py-sm text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button disabled={submitting} type="submit">
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
