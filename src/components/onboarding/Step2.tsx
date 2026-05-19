"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INDUSTRY_OPTIONS = [
  "Home Services",
  "Healthcare",
  "Retail",
  "Education",
  "Finance",
  "Technology",
  "Food & Beverage",
  "Legal",
  "Real Estate",
  "Automotive",
  "Beauty",
  "Construction",
  "Marketing",
  "Travel",
  "Fitness",
  "Entertainment",
  "Manufacturing",
  "Logistics",
  "Agriculture",
  "Non-profit",
  "Consulting",
  "Hospitality",
  "Media",
  "Telecom",
  "Pharmacy",
  "Professional Services",
  "Utilities",
  "Insurance",
  "Government",
  "Other",
];

export default function Step2() {
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
          industry: fm.get("industry") as string,
          custom_industry: fm.get("custom_industry") as string,
        });
        next();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-slate-700">Industry*</label>
        <input
          list="industries"
          name="industry"
          defaultValue={data.industry ?? ""}
          required
          className="h-8 w-full rounded border px-2"
        />
        <datalist id="industries">
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-sm text-slate-700">
          Custom industry (if not listed)
        </label>
        <Input
          name="custom_industry"
          defaultValue={data.custom_industry ?? ""}
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
