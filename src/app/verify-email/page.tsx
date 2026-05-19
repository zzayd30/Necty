import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { VerifyEmailForm } from "./verify-email-form";

export default async function VerifyEmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email_confirmed_at) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8">
      <Card className="w-full border-slate-200/80 bg-white/90 shadow-xl shadow-slate-950/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-950">
            Verify your email
          </CardTitle>
          <CardDescription className="text-slate-600">
            You can continue onboarding, but email verification is required
            before dashboard access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-slate-700">
            Signed in as{" "}
            <span className="font-medium text-slate-900">{user.email}</span>
          </p>
          <VerifyEmailForm />
          <div>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
