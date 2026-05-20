"use client";

import { useEffect, useState } from "react";
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

import toast from "react-hot-toast";
import { createBrowserClient } from "@supabase/ssr";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from recovery link hash on component mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        );

        // Parse URL hash to get recovery token parameters
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const expiresAt = params.get("expires_at");
        const type = params.get("type");

        if (!accessToken || type !== "recovery") {
          setError(
            "Invalid or expired password reset link. Please request a new one.",
          );
          setIsLoading(false);
          return;
        }

        // Manually set the session from the recovery link parameters
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError || !data.session) {
          setError(
            "Invalid or expired password reset link. Please request a new one.",
          );
        }
      } catch (err) {
        setError(
          "Failed to process password reset link. Please request a new one.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");

      if (!password || !confirmPassword) {
        throw new Error("Please fill in all fields");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message ?? "Failed to reset password");
      }

      setSuccessMessage(result.message ?? "Password reset successfully!");
      toast.success("Password reset successfully!");

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      const message = err?.message ?? "Failed to reset password";
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
            Password reset successful
          </CardTitle>
          <CardDescription className="text-slate-600">
            Your password has been reset. You can now log in with your new
            password.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <div className="mb-6 flex justify-center text-emerald-600">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="mb-6 text-slate-700">
            Redirecting to login in a few seconds...
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

  if (error && isLoading === false) {
    return (
      <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
        <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6 text-center">
          <CardTitle className="text-2xl text-slate-950">Error</CardTitle>
          <CardDescription className="text-slate-600">{error}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-slate-950 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
        <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6 text-center">
          <CardTitle className="text-2xl text-slate-950">
            Validating password reset link...
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-950"></div>
          </div>
        </CardContent>
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
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              New Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-slate-700"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={isPending || !!error}
          >
            {isPending ? "Resetting..." : "Reset password"}
          </Button>
        </form>
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
