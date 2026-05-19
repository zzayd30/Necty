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
import { useRouter } from "next/navigation";
import { useOnboardingApi } from "@/hooks/useOnboardingApi";

export default function PageContent() {
  const router = useRouter();
  const step = useOnboardingStore((s) => s.step);
  const data = useOnboardingStore((s) => s.data);
  const setData = useOnboardingStore((s) => s.set);
  const goTo = useOnboardingStore((s) => s.goTo);
  const [mounted, setMounted] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [initialSyncDone, setInitialSyncDone] = React.useState(false);
  const [querySessionId, setQuerySessionId] = React.useState<string | null>(null);
  const { loadProgress, saveProgress } = useOnboardingApi();

  React.useEffect(() => {
    setMounted(true);

    const href = typeof window !== 'undefined' ? window.location.href : 'unknown';
    console.log('[onboarding] mount', { href });

    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const sessionId = params.get('session_id');
    setQuerySessionId(sessionId);
    console.log('[onboarding] query params', { session_id: sessionId });

    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => {
        console.log('[onboarding] supabase session', data.session);
        setHasSession(Boolean(data.session));
      })
      .catch((err) => {
        console.error('[onboarding] supabase.getSession error', err);
      })
      .finally(() => {
        console.log('[onboarding] auth checked');
        setAuthChecked(true);
      });
  }, [router]);

  React.useEffect(() => {
    if (!mounted || !hasSession || initialSyncDone) {
      return;
    }

    console.log('[onboarding] loading progress', { mounted, hasSession, initialSyncDone });

    void (async () => {
      try {
        const progress = await loadProgress();

        console.log('[onboarding] progress loaded', progress);

        if (progress.completed) {
          console.log('[onboarding] onboarding already completed, redirecting to dashboard');
          router.replace('/dashboard');
          return;
        }

        if (progress.step) {
          goTo(progress.step);
        }

        if (progress.data && Object.keys(progress.data).length) {
          setData(progress.data);
        }
      } catch (error) {
        console.error('[onboarding] loadProgress error', error);
      } finally {
        console.log('[onboarding] initial sync done');
        setInitialSyncDone(true);
      }
    })();
  }, [goTo, hasSession, mounted, initialSyncDone, setData, loadProgress, router]);

  React.useEffect(() => {
    if (!mounted || !hasSession || !initialSyncDone) {
      return;
    }

    if (step === 1 && Object.keys(data).length === 0) {
      console.log('[onboarding] skip saveProgress because step 1 and no data');
      return;
    }

    console.log('[onboarding] saving progress', { step, data });

    void saveProgress({
      step,
      data,
    }).catch((err) => {
      console.error('[onboarding] saveProgress error', err);
    });
  }, [data, hasSession, mounted, initialSyncDone, step, saveProgress]);

  if (!mounted || !authChecked || (hasSession && !initialSyncDone)) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-sm space-y-4">
          <div>Loading onboarding...</div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Debug info</p>
            <p>mounted: {String(mounted)}</p>
            <p>authChecked: {String(authChecked)}</p>
            <p>hasSession: {String(hasSession)}</p>
            <p>initialSyncDone: {String(initialSyncDone)}</p>
            <p>session_id: {querySessionId ?? 'none'}</p>
            <p>step: {step}</p>
            <p>data keys: {Object.keys(data).length}</p>
          </div>
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
