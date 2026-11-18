'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { acceptInvitation } from '@/lib/api/workspaces';

export function AcceptInvitation({ token }: { token: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new ApiError('Invitation token is missing', 400);
      }
      return acceptInvitation({ token });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.replace(`/workspaces/${result.workspace.id}`);
    },
  });

  if (!token) {
    return (
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-xl font-semibold">Invalid invitation link</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This link is missing a token. Ask the inviter for a new invitation.
        </p>
        <Link href="/workspaces" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          Back to workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h1 className="text-xl font-semibold">Accept workspace invitation</h1>
      <p className="text-sm text-[var(--muted)]">
        You must be signed in with the email address that received this invitation.
      </p>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button
        type="button"
        disabled={mutation.isPending}
        className="w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] disabled:opacity-60"
        onClick={() => {
          setMessage(null);
          void mutation.mutateAsync().catch((error) => {
            setMessage(error instanceof ApiError ? error.message : 'Unable to accept invitation');
          });
        }}
      >
        {mutation.isPending ? 'Accepting…' : 'Accept invitation'}
      </button>
    </div>
  );
}