import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';

vi.mock('@/lib/api/health', () => ({
  fetchHealth: vi.fn().mockResolvedValue({
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      liveness: { status: 'up' },
      database: { status: 'up' },
    },
  }),
}));

describe('DashboardPage', () => {
  it('renders SyncBoard dashboard shell', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Welcome to SyncBoard')).toBeInTheDocument();
  });
});