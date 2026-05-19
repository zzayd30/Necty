"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onLogout() {
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      const result = (await response.json()) as {
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Logout failed.");
      }

      router.push(result.redirectTo ?? "/login");
      router.refresh();
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
