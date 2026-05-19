import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <Card className="grid w-full overflow-hidden border-white/70 bg-white/85 shadow-2xl shadow-slate-950/10 backdrop-blur-xl lg:grid-cols-[1.15fr_0.85fr]">
          <CardHeader className="space-y-4 border-b border-slate-200/70 bg-slate-950 px-6 py-10 text-white lg:border-b-0 lg:border-r lg:px-10">
            <Badge
              variant="outline"
              className="w-fit border-white/20 bg-white/10 text-white"
            >
              Supabase Auth + workspace bootstrap
            </Badge>
            <CardTitle className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              A clean starting point for multi-tenant login flows.
            </CardTitle>
            <CardDescription className="max-w-xl text-base leading-7 text-slate-200">
              Sign up, create a workspace, and route access through
              workspace_members so the system stays ready for future role and
              workspace switching.
            </CardDescription>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                <Link href="/signup">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 lg:p-10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Signup flow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Creates the Supabase auth user, inserts a workspace, and adds
                the owner membership in one pass.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Login flow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Signs in with password, resolves the user&apos;s workspace
                membership, and sends them to the dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Logout flow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Clears the Supabase session and returns the browser to the login
                screen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
