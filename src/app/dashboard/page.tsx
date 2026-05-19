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
import { LogoutButton } from "@/components/auth/logout-button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select(
      "workspace_id, role, accepted, invited_email, workspaces:workspace_id (id, business_name, industry, custom_industry, city, state, plan, plan_status, created_at)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const workspaces =
    memberships
      ?.map((membership) => {
        const workspace = Array.isArray(membership.workspaces)
          ? membership.workspaces[0]
          : membership.workspaces;

        return workspace
          ? {
              workspace,
              role: membership.role,
              accepted: membership.accepted,
            }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)) ??
    [];

  const currentWorkspace = workspaces[0] ?? null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-950/5 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-slate-300 bg-white text-slate-700"
            >
              Logged in
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-950">
              Dashboard
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Access is driven by workspace_members, so this dashboard stays
              ready for multi-workspace support.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Link href="/signup">Create another account</Link>
            </Button>
            <LogoutButton />
          </div>
        </header>

        {membershipError ? (
          <Card className="border-amber-200 bg-amber-50/80">
            <CardHeader>
              <CardTitle className="text-amber-950">
                Workspace lookup failed
              </CardTitle>
              <CardDescription className="text-amber-900/80">
                {membershipError.message}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200/80 bg-white/90 shadow-xl shadow-slate-950/5 backdrop-blur">
            <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6">
              <CardTitle className="text-xl text-slate-950">
                Current workspace
              </CardTitle>
              <CardDescription className="text-slate-600">
                The first accepted workspace is shown here. Later this can
                become the active workspace switcher.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {currentWorkspace ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-950 text-white">
                      {currentWorkspace.role}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-300 text-slate-700"
                    >
                      {currentWorkspace.workspace.plan}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-300 text-slate-700"
                    >
                      {currentWorkspace.workspace.plan_status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-heading text-2xl font-semibold text-slate-950">
                      {currentWorkspace.workspace.business_name}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {currentWorkspace.workspace.industry}
                      {currentWorkspace.workspace.custom_industry
                        ? ` · ${currentWorkspace.workspace.custom_industry}`
                        : ""}
                    </p>
                    <p className="text-sm text-slate-600">
                      {currentWorkspace.workspace.city},{" "}
                      {currentWorkspace.workspace.state}
                    </p>
                  </div>
                  <Separator className="bg-slate-200" />
                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Workspace id
                      </p>
                      <p className="mt-2 break-all text-slate-900">
                        {currentWorkspace.workspace.id}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Created
                      </p>
                      <p className="mt-2 text-slate-900">
                        {new Date(
                          currentWorkspace.workspace.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No workspace membership was found for this user.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 shadow-xl shadow-slate-950/5 backdrop-blur">
            <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6">
              <CardTitle className="text-xl text-slate-950">
                Workspace access
              </CardTitle>
              <CardDescription className="text-slate-600">
                The membership table remains the source of truth for all access
                decisions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {workspaces.length ? (
                workspaces.map((entry) => (
                  <div
                    key={entry.workspace.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {entry.workspace.business_name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {entry.workspace.city}, {entry.workspace.state}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-slate-300 text-slate-700"
                      >
                        {entry.role}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  This account has no accepted memberships yet.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
