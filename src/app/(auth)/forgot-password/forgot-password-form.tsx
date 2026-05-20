"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useAuthApi } from "@/hooks/useAuthApi";
import toast from "react-hot-toast";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { forgotPassword } = useAuthApi();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await forgotPassword({
        email: String(formData.get("email") ?? ""),
      });

      if (!result.success) {
        const message = result.message ?? "Failed to send reset link.";
        toast.error(message);
        setError(message);
        return;
      }

      toast.success("Password reset link sent to your email!");
      setSuccessMessage(
        result.data?.message ??
          result.message ??
          "Check your email for a password reset link.",
      );
    } catch (err: any) {
      const message = err?.message ?? "Failed to send reset link unexpectedly.";
      setError(message);
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  if (successMessage) {
    return (
      <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
        <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6 text-center">
          <CardTitle className="text-2xl text-slate-950">
            Check your email
          </CardTitle>
          <CardDescription className="text-slate-600">
            We&apos;ve sent a password reset link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center text-indigo-600">
            <svg
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5"
              />
            </svg>
          </div>
          <p className="text-slate-700 text-sm">
            Click the link in your email to reset your password. The link will
            expire in 24 hours.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-center border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 text-sm text-slate-600">
          <Link
            href="/login"
            className="font-medium text-slate-950 hover:underline"
          >
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
      <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6">
        <CardTitle className="text-2xl text-slate-950">
          Reset password
        </CardTitle>
        <CardDescription className="text-slate-600">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={isPending}
          >
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 text-sm text-slate-600">
        <span>Remember your password?</span>
        <Link
          href="/login"
          className="font-medium text-slate-950 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
