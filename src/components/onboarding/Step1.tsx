"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Step1() {
  const data = useOnboardingStore((s) => s.data);
  const set = useOnboardingStore((s) => s.set);
  const next = useOnboardingStore((s) => s.next);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fm = new FormData(e.currentTarget);
        set({
          business_name: fm.get("business_name") as string,
          client_name: fm.get("client_name") as string,
        });
        next();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-slate-700">Business name*</label>
        <Input
          name="business_name"
          defaultValue={data.business_name ?? ""}
          required
        />
      </div>
      <div>
        <label className="block text-sm text-slate-700">Client name*</label>
        <Input
          name="client_name"
          defaultValue={data.client_name ?? ""}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
