import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, extractApiErrorMessage } from './client';
import { useAuthStore } from '@/stores/auth-store';

describe('extractApiErrorMessage', () => {
  it('reads a nested NestJS HttpException message object', () => {
    const body = {
      statusCode: 400,
      path: '/api/v1/invitations/accept',
      message: {
        message: 'Invalid invitation',
        error: 'Bad Request',
        statusCode: 400,
      },
    };
    expect(extractApiErrorMessage(body, 400)).toBe('Invalid invitation');
  });

  it('joins validation array messages', () => {
    const body = {
      message: ['token must be longer', 'token should not be empty'],
    };
    expect(extractApiErrorMessage(body, 400)).toBe(
      'token must be longer token should not be empty',
    );
  });

  it('returns a plain string message', () => {
    expect(extractApiErrorMessage({ message: 'Invitation has expired' }, 400)).toBe(
      'Invitation has expired',
    );
  });

  it('uses a safe fallback when message is not usable', () => {
    expect(extractApiErrorMessage({ message: { error: 'Bad Request' } }, 400)).toBe(
      'API request failed: 400',
    );
  });

  it('uses a generic fallback for server errors', () => {
    expect(extractApiErrorMessage({}, 500)).toBe('Something went wrong. Please try again.');
  });
});

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

  it('surfaces nested API errors without object stringification', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        statusCode: 400,
        message: { message: 'Invitation has been revoked', error: 'Bad Request' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/invitations/accept')).rejects.toMatchObject({
      message: 'Invitation has been revoked',
      status: 400,
    });
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