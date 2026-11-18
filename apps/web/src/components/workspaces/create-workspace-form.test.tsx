import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { CreateWorkspaceForm } from '@/components/workspaces/create-workspace-form';

describe('CreateWorkspaceForm', () => {
  it('validates minimum name length', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreateWorkspaceForm />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    expect(
      await screen.findByText('Workspace name must be at least 2 characters'),
    ).toBeInTheDocument();
  });
});