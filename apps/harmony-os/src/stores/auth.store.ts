import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Employee } from '@/types'

interface AuthState {
  token: string | null
  employee: Employee | null
  login: (token: string, employee: Employee) => void
  logout: () => void
  isOwner: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      employee: null,
      login: (token, employee) => set({ token, employee }),
      logout: () => set({ token: null, employee: null }),
      isOwner: () => get().employee?.role === 'owner',
    }),
    { name: 'auth-storage' },
  ),
)
