import Link from "next/link";
import { ShieldCheck, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.08),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.08),_transparent_28%),linear-gradient(180deg,_#f7fafc_0%,_#eef2ff_100%)] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="flex flex-col justify-center gap-6 py-8 lg:py-16">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold tracking-[0.22em] uppercase text-slate-600"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
              <Workflow className="size-5" />
            </span>
            Necty
          </Link>
          <Badge
            variant="outline"
            className="w-fit border-slate-300 bg-white/80 text-slate-700 backdrop-blur"
          >
            <ShieldCheck className="size-3.5" />
            Multi-workspace auth
          </Badge>
          <div className="max-w-xl space-y-4">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              One account, one workspace created instantly.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Sign up once, boot a workspace automatically, and route every user
              through workspace_members for access control.
            </p>
          </div>
          <div className="grid max-w-lg gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="font-medium text-slate-950">Signup</p>
              <p className="mt-1">
                Creates the auth user, workspace, and owner membership.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="font-medium text-slate-950">Login</p>
              <p className="mt-1">
                Validates the session and lands the user in dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="font-medium text-slate-950">Logout</p>
              <p className="mt-1">
                Clears the Supabase session and returns to login.
              </p>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center py-8 lg:justify-end lg:py-16">
          <div className="w-full max-w-xl">{children}</div>
        </section>
      </div>
    </div>
  );
}
