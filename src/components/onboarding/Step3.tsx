"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Step3() {
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
          city: fm.get("city") as string,
          state: fm.get("state") as string,
          service_area_radius: fm.get("service_area_radius") as string,
        });
        next();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-slate-700">City*</label>
        <Input name="city" defaultValue={data.city ?? ""} required />
      </div>
      <div>
        <label className="block text-sm text-slate-700">State*</label>
        <Input name="state" defaultValue={data.state ?? ""} required />
      </div>
      <div>
        <label className="block text-sm text-slate-700">
          Service area radius (miles)*
        </label>
        <Input
          name="service_area_radius"
          type="number"
          min="0"
          defaultValue={data.service_area_radius ?? ""}
          required
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
