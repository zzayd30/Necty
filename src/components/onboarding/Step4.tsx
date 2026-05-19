"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Step4() {
  const data = useOnboardingStore((s) => s.data);
  const set = useOnboardingStore((s) => s.set);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fm = new FormData(e.currentTarget);
        set({
          competitors_to_monitor: fm.get("competitors_to_monitor") as string,
        });
        next();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-slate-700">
          Competitors to monitor (comma-separated)
        </label>
        <Input
          name="competitors_to_monitor"
          defaultValue={data.competitors_to_monitor ?? ""}
        />
      </div>
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            prev();
          }}
        >
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
