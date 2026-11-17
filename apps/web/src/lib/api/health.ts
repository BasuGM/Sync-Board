import type { HealthResponse } from '@syncboard/shared';
import { apiRequest } from '@/lib/api/client';

export function fetchHealth() {
  return apiRequest<HealthResponse>('/health');
}