import type { AuthUser } from '@syncboard/shared';
import { clientEnv } from '@/lib/env';
import { useAuthStore } from '@/stores/auth-store';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function extractApiErrorMessage(body: unknown, status: number): string {
  const statusFallback = `API request failed: ${status}`;

  if (body === null || body === undefined) {
    return statusFallback;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed || statusFallback;
  }

  if (typeof body !== 'object') {
    return statusFallback;
  }

  const record = body as Record<string, unknown>;
  const payload = record.message;

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed || statusFallback;
  }

  if (Array.isArray(payload)) {
    const parts = payload
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  if (payload && typeof payload === 'object') {
    const nested = payload as Record<string, unknown>;
    if (typeof nested.message === 'string') {
      const trimmed = nested.message.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  if (status >= 500) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return statusFallback;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { accessToken: string; user: AuthUser };
      useAuthStore.getState().setSession(data.accessToken, data.user);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function buildHeaders(init?: RequestInit): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };
}

export async function apiRequest<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const url = `${clientEnv.NEXT_PUBLIC_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: buildHeaders(init),
  });

  if (response.status === 401 && !retried && !path.startsWith('/auth/')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, init, true);
    }
    useAuthStore.getState().clearSession();
  }

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = extractApiErrorMessage(body, response.status);
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}