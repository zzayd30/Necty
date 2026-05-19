"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useAuthApi } from "@/hooks/useAuthApi";

export function VerifyEmailForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { resendVerification } = useAuthApi();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const result = await resendVerification();
      setMessage(result.message ?? "Verification email sent.");
    } catch (err: any) {
      setError(err.message ?? "Unable to resend verification.");
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
