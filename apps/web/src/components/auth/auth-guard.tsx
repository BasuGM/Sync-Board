'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isBootstrapping } = useAuthStore();

  useEffect(() => {
    if (!isBootstrapping && !user) {
      router.replace('/login');
    }
  }, [isBootstrapping, router, user]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--muted)]">
        Restoring session…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}