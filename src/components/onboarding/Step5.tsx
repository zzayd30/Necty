"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";

const OPTIONS = ["Reddit", "TikTok", "Instagram", "Facebook", "Google Maps"];

export default function Step5() {
  const data = useOnboardingStore((s) => s.data);
  const set = useOnboardingStore((s) => s.set);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fm = new FormData(e.currentTarget);
        const values = fm.getAll("platforms").map((v) => String(v));
        set({ platforms: values.join(",") });
        next();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <p className="text-sm text-slate-700">Select platforms to monitor*</p>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="platforms"
                value={opt}
                defaultChecked={String(data.platforms || "")
                  .split(",")
                  .includes(opt)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
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
