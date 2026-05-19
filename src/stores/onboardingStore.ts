import { create } from 'zustand'

type OnboardingState = {
  step: number
  data: Record<string, string | number | string[] | null>
  next: () => void
  prev: () => void
  set: (partial: Record<string, string | number | string[] | null>) => void
  goTo: (n: number) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  step: 1,
  data: {},
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
}))

export default useOnboardingStore
