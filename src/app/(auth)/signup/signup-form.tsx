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

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: String(formData.get("fullName") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || result.error) {
        setError(result.error ?? "Signup failed.");
        return;
      }

      router.push(result.redirectTo ?? "/onboarding");
      router.refresh();
    } catch {
      setError("Signup failed unexpectedly.");
    } finally {
      setIsPending(false);
    }
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
