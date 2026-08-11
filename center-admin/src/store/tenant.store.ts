import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Center, OnboardingChecklist } from '@/types/models'

interface TenantState {
  center: Center | null
  setCenter: (center: Center) => void
  updateChecklist: (checklist: OnboardingChecklist) => void
  clearTenant: () => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      center: null,

      setCenter: (center) => set({ center }),

      updateChecklist: (checklist) =>
        set((state) => ({
          center: state.center ? { ...state.center, onboardingChecklist: checklist } : null,
        })),

      clearTenant: () => set({ center: null }),
    }),
    {
      name: 'tenant-storage',
    },
  ),
)
