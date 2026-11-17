'use client';

import { useQuery } from '@tanstack/react-query';
import { ProfilePreferencesForm } from '@/components/forms/profile-preferences-form';
import { fetchHealth } from '@/lib/api/health';

const PLACEHOLDER_STATS = [
  { label: 'Active workspaces', value: '—', hint: 'Auth & workspaces in M2+' },
  { label: 'Open boards', value: '—', hint: 'Boards in a later milestone' },
  { label: 'Tasks in progress', value: '—', hint: 'Tasks in a later milestone' },
];

export function DashboardShell() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome to SyncBoard</h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Your collaborative workspace foundation is ready. This dashboard shell will host
          workspaces, boards, and real-time task flows in upcoming milestones.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLACEHOLDER_STATS.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
          >
            <p className="text-sm text-[var(--muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{stat.hint}</p>
          </article>
        ))}
      </section>

      <ProfilePreferencesForm />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <h3 className="text-sm font-medium">Platform status</h3>
        <div className="mt-3 text-sm text-[var(--muted)]">
          {healthQuery.isLoading && <p>Checking API health…</p>}
          {healthQuery.isError && (
            <p className="text-amber-600 dark:text-amber-400">
              API unreachable. Start the backend with <code>pnpm dev</code> in the monorepo root.
            </p>
          )}
          {healthQuery.isSuccess && (
            <ul className="space-y-1">
              <li>
                API: <span className="font-medium text-emerald-600">{healthQuery.data.status}</span>
              </li>
              <li>Database: {healthQuery.data.checks.database.status}</li>
              <li className="text-xs">Checked at {healthQuery.data.timestamp}</li>
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}