import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './client';
import { useAuthStore } from '@/stores/auth-store';

describe('apiRequest', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'expired',
      user: { id: '1', name: 'A', email: 'a@b.com' },
      isBootstrapping: false,
    });
    vi.restoreAllMocks();
  });

  it('refreshes once on 401 and retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          accessToken: 'fresh',
          user: { id: '1', name: 'A', email: 'a@b.com' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiRequest<{ ok: boolean }>('/health');
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().accessToken).toBe('fresh');
  });

  it('clears session when refresh fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/health')).rejects.toThrow();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});