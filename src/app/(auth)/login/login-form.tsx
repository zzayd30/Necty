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

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { login } = useAuthApi();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await login({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      if (!result.success) {
        const message = result.message ?? "Login failed unexpectedly.";
        const userEmail = String(formData.get("email") ?? "");

        // Redirect to verify email if email is not confirmed
        if (result.status === 400 && message.toLowerCase().includes("email")) {
          // toast.error(message);
          router.push(`/verify-email?email=${encodeURIComponent(userEmail)}`);
          return;
        }

        toast.error(message);
        setError(message);
        return;
      }

      toast.success("Logged in successfully!");
      router.push(result.data?.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (err: any) {
      const message = err?.message ?? "Login failed unexpectedly.";
      toast.error(message);
      setError(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
      <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6">
        <CardTitle className="text-2xl text-slate-950">Welcome back</CardTitle>
        <CardDescription className="text-slate-600">
          Sign in to continue into your dashboard.
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 text-sm text-slate-600">
        <Link
          href="/forgot-password"
          className="font-medium text-slate-950 hover:underline"
        >
          Forgot password?
        </Link>
        <div className="flex items-center gap-1">
          <span>Need a workspace?</span>
          <Link
            href="/signup"
            className="font-medium text-slate-950 hover:underline"
          >
            Create account
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
