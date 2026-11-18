import Link from 'next/link';
import { WorkspaceList } from '@/components/workspaces/workspace-list';

export default function WorkspacesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          <p className="text-sm text-[var(--muted)]">Teams and shared spaces you belong to.</p>
        </div>
        <Link
          href="/workspaces/new"
          className="inline-flex rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)]"
        >
          Create workspace
        </Link>
      </div>
      <WorkspaceList />
    </div>
  );
}