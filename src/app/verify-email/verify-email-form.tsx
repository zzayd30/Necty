"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function VerifyEmailForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok || result.error) {
        setError(result.error ?? "Unable to resend verification.");
        return;
      }

      setMessage(result.message ?? "Verification email sent.");
    } catch {
      setError("Unable to resend verification.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Button
        type="submit"
        className="bg-slate-950 text-white hover:bg-slate-800"
        disabled={isPending}
      >
        {isPending ? "Sending..." : "Resend verification email"}
      </Button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
