export type HealthComponentStatus = 'up' | 'down';

export interface HealthComponentCheck {
  status: HealthComponentStatus;
  message?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  checks: {
    liveness: HealthComponentCheck;
    database: HealthComponentCheck;
  };
}