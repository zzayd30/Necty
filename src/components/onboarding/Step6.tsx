"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OFFERS = ["Basic Cleaning", "Full Audit", "Monthly Monitoring"];

export default function Step6() {
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
          default_offer: fm.get("default_offer") as string,
          booking_link: fm.get("booking_link") as string,
        });
        next();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-slate-700">Default offer*</label>
        <select
          name="default_offer"
          defaultValue={data.default_offer ?? OFFERS[0]}
          className="h-8 w-full rounded border px-2"
        >
          {OFFERS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-700">
          Booking link (URL)
        </label>
        <Input
          name="booking_link"
          type="url"
          defaultValue={data.booking_link ?? ""}
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
