import type { AuthResponse, AuthUser } from '@syncboard/shared';
import { apiRequest } from '@/lib/api/client';

export function registerUser(payload: { name: string; email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refreshSession() {
  return apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' });
}

export function logoutUser() {
  return apiRequest<{ success: true }>('/auth/logout', { method: 'POST' });
}

export function fetchCurrentUser() {
  return apiRequest<AuthUser>('/auth/me');
}