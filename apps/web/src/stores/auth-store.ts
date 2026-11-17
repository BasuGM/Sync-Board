'use client';

import type { AuthUser } from '@syncboard/shared';
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isBootstrapping: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  setBootstrapping: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isBootstrapping: true,
  setSession: (accessToken, user) => set({ accessToken, user, isBootstrapping: false }),
  clearSession: () => set({ accessToken: null, user: null, isBootstrapping: false }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));