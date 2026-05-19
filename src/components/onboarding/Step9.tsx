"use client";
import React from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function Step9() {
  const data = useOnboardingStore((s) => s.data);
  const prev = useOnboardingStore((s) => s.prev);
  const [hasSession, setHasSession] = React.useState(false);
  const [sessionReady, setSessionReady] = React.useState(false);
  const [planLabel, setPlanLabel] = React.useState("NECTY Pro");
  const [planPriceLabel, setPlanPriceLabel] = React.useState("$199.99 / month");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setSessionReady(true);
    });

    void (async () => {
      const response = await fetch("/api/billing/active-product", {
        method: "GET",
        cache: "no-store",
      });
      const result = (await response.json()) as {
        product?: {
          name: string;
          unit_amount_cents: number;
          recurring_interval: string;
        } | null;
      };
      const product = result.product;

      if (!product) {
        return;
      }

      const amount = (product.unit_amount_cents / 100).toFixed(2);
      setPlanLabel(product.name);
      setPlanPriceLabel(`$${amount} / ${product.recurring_interval}`);
    })();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSession) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/onboarding/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || result.error) {
        setError(result.error ?? "Unable to finish onboarding.");
        return;
      }

      window.location.href = result.redirectTo ?? "/dashboard";
    } catch {
      setError("Unable to finish onboarding.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        Payment: {planLabel} — {planPriceLabel}
      </p>
      {!hasSession && sessionReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Confirm your email first. Your onboarding draft is saved on this
          device and you can finish payment after verification.
        </div>
      ) : null}
      <form onSubmit={onSubmit}>
        {Object.keys(data).map((k) => (
          <input
            key={k}
            type="hidden"
            name={k}
            value={
              Array.isArray(data[k]) ? data[k].join(",") : String(data[k] ?? "")
            }
          />
        ))}
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
          <Button
            type="submit"
            disabled={!sessionReady || !hasSession || isPending}
          >
            {isPending
              ? "Processing..."
              : hasSession
                ? "Pay & Finish"
                : "Confirm email to finish"}
          </Button>
        </div>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
