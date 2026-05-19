"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnboardingStore } from "@/stores/onboardingStore";
import Step1 from "@/components/onboarding/Step1";
import Step2 from "@/components/onboarding/Step2";
import Step3 from "@/components/onboarding/Step3";
import Step4 from "@/components/onboarding/Step4";
import Step5 from "@/components/onboarding/Step5";
import Step6 from "@/components/onboarding/Step6";
import Step7 from "@/components/onboarding/Step7";
import Step8 from "@/components/onboarding/Step8";
import Step9 from "@/components/onboarding/Step9";

import { useOnboardingApi } from "@/hooks/useOnboardingApi";

export default function PageContent() {
  const step = useOnboardingStore((s) => s.step);
  const data = useOnboardingStore((s) => s.data);
  const setData = useOnboardingStore((s) => s.set);
  const goTo = useOnboardingStore((s) => s.goTo);
  const [hydrated, setHydrated] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);
  const [initialSyncDone, setInitialSyncDone] = React.useState(false);
  const { loadProgress, saveProgress } = useOnboardingApi();

  React.useEffect(() => {
    if (useOnboardingStore.persist?.hasHydrated()) {
      setHydrated(true);
    }

    const unsubscribe = useOnboardingStore.persist?.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useOnboardingStore.persist && !useOnboardingStore.persist.hasHydrated()) {
      useOnboardingStore.persist.rehydrate();
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated || !hasSession || initialSyncDone) {
      return;
    }

    void (async () => {
      try {
        const progress = await loadProgress();

        if (progress.step) {
          goTo(progress.step);
        }

        if (progress.data && Object.keys(progress.data).length) {
          setData(progress.data);
        }
      } catch (error) {
        // Ignore load errors or log them
      } finally {
        setInitialSyncDone(true);
      }
    })();
  }, [goTo, hasSession, hydrated, initialSyncDone, setData, loadProgress]);

  React.useEffect(() => {
    if (!hydrated || !hasSession || !initialSyncDone) {
      return;
    }

    const timer = setTimeout(() => {
      void saveProgress({
        step,
        data,
      });
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [data, hasSession, hydrated, initialSyncDone, step, saveProgress]);

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-sm">
          Restoring your onboarding draft...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4 space-y-2 text-sm text-slate-600">
        <div>Step {step} of 9</div>
        {!hasSession ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            Your progress is saved on this device. Confirm your email to finish
            onboarding and activate payment. Once a session is available,
            progress syncs to your account.
          </div>
        ) : null}
      </div>
      <div>
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
        {step === 5 && <Step5 />}
        {step === 6 && <Step6 />}
        {step === 7 && <Step7 />}
        {step === 8 && <Step8 />}
        {step === 9 && <Step9 />}
      </div>
    </div>
  );
}
