import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

function loadClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  });

  if (!parsed.success) {
    throw new Error(`Invalid client environment: ${parsed.error.message}`);
  }

  return parsed.data;
}

export const clientEnv = loadClientEnv();