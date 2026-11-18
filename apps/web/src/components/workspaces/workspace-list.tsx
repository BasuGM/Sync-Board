'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { listWorkspaces } from '@/lib/api/workspaces';

export function WorkspaceList() {
  const query = useQuery({
    queryKey: ['workspaces'],
    queryFn: listWorkspaces,
  });

  if (query.isLoading) {
    return <p className="text-sm text-[var(--muted)]">Loading workspaces…</p>;
  }

  if (query.isError) {
    return (
      <p className="text-sm text-red-600" role="alert">
        Unable to load workspaces.
      </p>
    );
  }

  const workspaces = query.data ?? [];

  if (workspaces.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <h2 className="text-lg font-semibold">No workspaces yet</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Create a workspace to collaborate with your team.
        </p>
        <Link
          href="/workspaces/new"
          className="mt-4 inline-flex rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)]"
        >
          Create workspace
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((workspace) => (
        <li key={workspace.id}>
          <Link
            href={`/workspaces/${workspace.id}`}
            className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-indigo-300"
          >
            <h2 className="font-semibold">{workspace.name}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">/{workspace.slug}</p>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
                {workspace.role}
              </span>
              <span className="text-[var(--muted)]">
                {workspace.memberCount} member{workspace.memberCount === 1 ? '' : 's'}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}