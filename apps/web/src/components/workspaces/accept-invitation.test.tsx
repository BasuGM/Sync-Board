import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import * as workspacesApi from '@/lib/api/workspaces';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/api/workspaces');

import { AcceptInvitation } from '@/components/workspaces/accept-invitation';

describe('AcceptInvitation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('shows invalid state without token', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AcceptInvitation token={null} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Invalid invitation link')).toBeInTheDocument();
  });

  it('shows a readable API error when acceptance fails', async () => {
    vi.spyOn(workspacesApi, 'acceptInvitation').mockRejectedValue(
      new ApiError('Invalid invitation', 400),
    );
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AcceptInvitation token="test-token-value" />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByText('Invalid invitation')).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });

  it('calls accept invitation on success', async () => {
    vi.spyOn(workspacesApi, 'acceptInvitation').mockResolvedValue({
      workspace: {
        id: 'ws-1',
        name: 'Team',
        slug: 'team',
        role: 'MEMBER',
        memberCount: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AcceptInvitation token="test-token-value" />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }));
    await waitFor(() => {
      expect(workspacesApi.acceptInvitation).toHaveBeenCalledWith({ token: 'test-token-value' });
    });
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });
});