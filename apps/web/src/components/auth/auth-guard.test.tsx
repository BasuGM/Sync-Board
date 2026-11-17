import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();

const authSlice = vi.hoisted(() => ({
  user: null as { id: string; name: string; email: string } | null,
  isBootstrapping: false,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => authSlice,
}));

import { AuthGuard } from './auth-guard';

describe('AuthGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    authSlice.user = null;
    authSlice.isBootstrapping = false;
  });

  it('redirects when session is absent after bootstrap', () => {
    render(
      <AuthGuard>
        <p>Secret</p>
      </AuthGuard>,
    );
    expect(replace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    authSlice.user = { id: '1', name: 'A', email: 'a@b.com' };
    render(
      <AuthGuard>
        <p>Secret</p>
      </AuthGuard>,
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});