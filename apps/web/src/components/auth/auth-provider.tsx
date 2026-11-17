'use client';

import { useEffect } from 'react';
import { refreshSession } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, clearSession, setBootstrapping } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const data = await refreshSession();
        if (mounted) {
          setSession(data.accessToken, data.user);
        }
      } catch {
        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [clearSession, setBootstrapping, setSession]);

  return children;
}