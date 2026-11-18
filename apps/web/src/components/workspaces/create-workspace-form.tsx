'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/lib/api/client';
import { createWorkspace } from '@/lib/api/workspaces';
import {
  type CreateWorkspaceFormValues,
  createWorkspaceSchema,
} from '@/lib/forms/workspace-schemas';

export function CreateWorkspaceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceFormValues>({ resolver: zodResolver(createWorkspaceSchema) });

  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async (workspace) => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.replace(`/workspaces/${workspace.id}`);
    },
  });

  return (
    <form
      className="max-w-lg space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        try {
          await mutation.mutateAsync({ name: values.name });
        } catch (error) {
          setFormError(error instanceof ApiError ? error.message : 'Unable to create workspace');
        }
      })}
    >
      <div>
        <h1 className="text-xl font-semibold">Create workspace</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">You will be the workspace owner.</p>
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <label className="block text-sm">
        Workspace name
        <input
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2"
          {...register('name')}
        />
        {errors.name && (
          <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>
        )}
      </label>
      <button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {mutation.isPending ? 'Creating…' : 'Create workspace'}
      </button>
    </form>
  );
}