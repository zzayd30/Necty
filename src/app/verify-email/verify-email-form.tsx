"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuthApi } from "@/hooks/useAuthApi";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { resendVerification } = useAuthApi();

  // Get email from URL query params
  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setUserEmail(decodeURIComponent(emailFromUrl));
    }
  }, [searchParams]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const result = await resendVerification(userEmail ?? undefined);
      if (!result.success) {
        const message = result.message ?? "Unable to resend verification.";
        setError(message);
        return;
      }
      setMessage(
        result.data?.message ?? result.message ?? "Verification email sent.",
      );
    } catch (err: any) {
      setError(err.message ?? "Unable to resend verification.");
    } finally {
      setIsPending(false);
    }
  }

  // If no email found in URL, show login prompt
  if (!userEmail) {
    return (
      <Card className="w-full border-slate-200/80 bg-white/90 shadow-xl shadow-slate-950/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-950">
            Email verification required
          </CardTitle>
          <CardDescription className="text-slate-600">
            Please log in to verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-700">
            You need to log in first to verify your email.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-slate-950 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-slate-200/80 bg-white/90 shadow-xl shadow-slate-950/5 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-950">
          Verify your email
        </CardTitle>
        <CardDescription className="text-slate-600">
          You can continue onboarding, but email verification is required before
          dashboard access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {userEmail && (
          <p className="text-sm text-slate-700">
            Signed in as{" "}
            <span className="font-medium text-slate-900">{userEmail}</span>
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Button
            type="submit"
            className="w-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={isPending}
          >
            {isPending ? "Sending..." : "Resend verification email"}
          </Button>
          {message ? (
            <p className="text-sm text-emerald-700">{message}</p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
        <div className="border-t border-slate-200 pt-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-950 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
