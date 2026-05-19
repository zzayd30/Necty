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

import { toast } from "react-hot-toast";
import { useAuthApi } from "@/hooks/useAuthApi";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { signup } = useAuthApi();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await signup({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      toast.success(result.message ?? "User created! Please verify your email.");
      setSuccessMessage(result.message ?? "User created and verification email sent.");
    } catch (err: any) {
      setError(err.message ?? "Signup failed unexpectedly.");
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
            We&apos;ve sent a verification link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center text-indigo-600">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          <p className="text-slate-700 text-sm">
            Please check your inbox and spam folder to confirm your email. Once verified, you will be redirected to the onboarding flow.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-center border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 text-sm text-slate-600">
          <Link href="/login" className="font-medium text-slate-950 hover:underline">
            Go to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
      <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6">
        <CardTitle className="text-2xl text-slate-950">
          Create your account
        </CardTitle>
        <CardDescription className="text-slate-600">
          Create your account - we&apos;ll collect workspace details in the
          onboarding flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                placeholder="Avery Stone"
              />
            </div>
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
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="At least 8 characters"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={isPending}
          >
            {isPending ? "Creating workspace..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 text-sm text-slate-600">
        <span>Already have an account?</span>
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
