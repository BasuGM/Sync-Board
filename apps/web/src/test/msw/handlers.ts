import { HttpResponse, http } from 'msw';

export const handlers = [
  http.get('http://localhost:3001/api/v1/health', () =>
    HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        liveness: { status: 'up' },
        database: { status: 'up' },
      },
    }),
  ),
];