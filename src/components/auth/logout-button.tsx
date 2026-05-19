"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useAuthApi } from "@/hooks/useAuthApi";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const { logout } = useAuthApi();

  async function onLogout() {
    setIsPending(true);
    try {
      const result = await logout();
      router.push(result.redirectTo ?? "/login");
      router.refresh();
    } catch (err: any) {
      console.error(err.message ?? "Logout failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      className="bg-slate-950 text-white hover:bg-slate-800"
      onClick={onLogout}
      disabled={isPending}
    >
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
