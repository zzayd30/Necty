"use client";
import React, { useState } from "react";
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

  const [industry, setIndustry] = useState(data.industry ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fm = new FormData(e.currentTarget);

        const selectedIndustry = fm.get("industry") as string;
        const customIndustry = fm.get("custom_industry") as string;

        set({
          industry: selectedIndustry,
          custom_industry: customIndustry,
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
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          required
          className="h-8 w-full rounded border px-2"
        />

        <datalist id="industries">
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </div>

      {/* 👇 Only show when "Other" is selected */}
      {industry === "Other" && (
        <div>
          <label className="block text-sm text-slate-700">
            Custom industry
          </label>
          <Input
            name="custom_industry"
            defaultValue={data.custom_industry ?? ""}
            placeholder="Enter your industry"
          />
        </div>
      )}

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