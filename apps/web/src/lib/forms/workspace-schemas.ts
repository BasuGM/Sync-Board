import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100),
});

export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = createWorkspaceSchema;

export type UpdateWorkspaceFormValues = z.infer<typeof updateWorkspaceSchema>;

export const createInvitationSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type CreateInvitationFormValues = z.infer<typeof createInvitationSchema>;