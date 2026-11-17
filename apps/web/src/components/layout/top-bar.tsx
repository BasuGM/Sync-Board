'use client';

import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { sidebarOpen, toggleSidebar } = useUiStore();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          ☰
        </button>
        <h1 className="text-sm font-medium text-[var(--muted)]">Workspace overview</h1>
      </div>
      <div className="flex items-center gap-3">
        {user && <span className="hidden text-sm text-[var(--muted)] sm:inline">{user.name}</span>}
        <ResourcePlaceholder />
        {user && (
          <button
            type="button"
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-900"
            onClick={async () => {
              try {
                await logoutUser();
              } finally {
                clearSession();
                router.replace('/login');
              }
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}

function ResourcePlaceholder() {
  return (
    <div className="hidden items-center gap-2 text-xs text-[var(--muted)] sm:flex">
      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        Milestone 1
      </span>
      <span>Foundation release</span>
    </div>
  );
}