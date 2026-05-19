import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type OnboardingState = {
  step: number
  data: Record<string, string | number | string[] | null>
  hasHydrated: boolean
  next: () => void
  prev: () => void
  set: (partial: Record<string, string | number | string[] | null>) => void
  goTo: (n: number) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 1,
      data: {},
      hasHydrated: false,
      next: () => set({ step: Math.min(9, get().step + 1) }),
      prev: () => set({ step: Math.max(1, get().step - 1) }),
      goTo: (n: number) => set({ step: Math.max(1, Math.min(9, n)) }),
      set: (partial) =>
        set({
          data: {
            ...get().data,
            ...Object.fromEntries(
              Object.entries(partial).filter(([, value]) => value !== undefined)
            ),
          } as Record<string, string | number | string[] | null>,
        }),
      reset: () => set({ step: 1, data: {} }),
    }),
    {
      name: 'necty-onboarding-draft',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true
        }
      },
      partialize: (state) => ({
        step: state.step,
        data: state.data,
      }),
    }
  )
)

export default useOnboardingStore
