import { useCallback } from "react";

import { onboardingApi, type OnboardingFinalizePayload, type OnboardingProgressPayload } from "@/lib/api";

export function useOnboardingApi() {
  const loadProgress = useCallback(() => onboardingApi.loadProgress(), []);
  const saveProgress = useCallback(
    (payload: OnboardingProgressPayload) => onboardingApi.saveProgress(payload),
    []
  );
  const finalize = useCallback(
    (payload: OnboardingFinalizePayload) => onboardingApi.finalize(payload),
    []
  );

  return {
    loadProgress,
    saveProgress,
    finalize,
  };
}
