"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";

const TONES = ["Professional", "Friendly", "Urgent", "Conversational"];

export default function Step7() {
  const data = useOnboardingStore((s) => s.data);
  const set = useOnboardingStore((s) => s.set);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fm = new FormData(e.currentTarget);
        set({ preferred_tone: fm.get("preferred_tone") as string });
        next();
      }}
      className="space-y-4"
    >
      <div>
        <p className="text-sm text-slate-700">Preferred tone*</p>
        <div className="flex gap-3">
          {TONES.map((t) => (
            <label key={t} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="preferred_tone"
                value={t}
                defaultChecked={data.preferred_tone === t}
                required
              />
              <span className="text-sm">{t}</span>
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
