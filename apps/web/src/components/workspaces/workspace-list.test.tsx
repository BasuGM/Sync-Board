import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceList } from '@/components/workspaces/workspace-list';
import * as workspacesApi from '@/lib/api/workspaces';

vi.mock('@/lib/api/workspaces');

describe('WorkspaceList', () => {
  it('shows empty state when user has no workspaces', async () => {
    vi.spyOn(workspacesApi, 'listWorkspaces').mockResolvedValue([]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <WorkspaceList />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('No workspaces yet')).toBeInTheDocument();
  });
});