import { z } from 'zod';

export const profilePreferencesSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  notificationsEnabled: z.boolean().default(true),
});

export type ProfilePreferencesForm = z.infer<typeof profilePreferencesSchema>;