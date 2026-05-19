"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";

const FREQUENCIES = ["Every 6 hrs", "Every 12 hrs", "Daily", "Weekly"];

export default function Step8() {
  const data = useOnboardingStore((s) => s.data);
  const set = useOnboardingStore((s) => s.set);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fm = new FormData(e.currentTarget);
        set({ run_frequency: fm.get("run_frequency") as string });
        next();
      }}
      className="space-y-4"
    >
      <div>
        <p className="text-sm text-slate-700">Scrape frequency*</p>
        <select
          name="run_frequency"
          defaultValue={data.run_frequency ?? FREQUENCIES[2]}
          className="h-8 w-full rounded border px-2"
        >
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
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
