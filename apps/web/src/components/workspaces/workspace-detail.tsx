'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { WorkspaceMemberView, WorkspaceRole } from '@syncboard/shared';
import { ApiError } from '@/lib/api/client';
import {
  changeMemberRole,
  createInvitation,
  getWorkspace,
  listPendingInvitations,
  removeWorkspaceMember,
  revokeInvitation,
  updateWorkspace,
  workspacePermissions,
} from '@/lib/api/workspaces';
import {
  type CreateInvitationFormValues,
  createInvitationSchema,
  type UpdateWorkspaceFormValues,
  updateWorkspaceSchema,
} from '@/lib/forms/workspace-schemas';
import { useAuthStore } from '@/stores/auth-store';

const MEMBER_ROLES: WorkspaceRole[] = ['ADMIN', 'MEMBER'];

export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [nameError, setNameError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId),
  });

  const permissions = useMemo(() => {
    if (!workspaceQuery.data) {
      return null;
    }
    return workspacePermissions(workspaceQuery.data.role);
  }, [workspaceQuery.data]);

  const invitationsQuery = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => listPendingInvitations(workspaceId),
    enabled: Boolean(workspaceQuery.data && permissions?.canRevokeInvitations),
  });

  const nameForm = useForm<UpdateWorkspaceFormValues>({
    resolver: zodResolver(updateWorkspaceSchema),
    values: workspaceQuery.data ? { name: workspaceQuery.data.name } : undefined,
  });

  const inviteForm = useForm<CreateInvitationFormValues>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const updateNameMutation = useMutation({
    mutationFn: (values: UpdateWorkspaceFormValues) =>
      updateWorkspace(workspaceId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (values: CreateInvitationFormValues) =>
      createInvitation(workspaceId, values),
    onSuccess: async (result) => {
      setInviteLink(result.invitationUrl);
      await queryClient.invalidateQueries({
        queryKey: ['workspace-invitations', workspaceId],
      });
      inviteForm.reset({ email: '', role: 'MEMBER' });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(workspaceId, invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['workspace-invitations', workspaceId],
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      changeMemberRole(workspaceId, memberId, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeWorkspaceMember(workspaceId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  if (workspaceQuery.isLoading) {
    return <p className="text-sm text-[var(--muted)]">Loading workspace…</p>;
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <p className="text-sm text-red-600" role="alert">
        Unable to load this workspace.
      </p>
    );
  }

  const workspace = workspaceQuery.data;
  const currentMember = workspace.members.find((m) => m.userId === user?.id);

  async function handleLeave() {
    if (!currentMember || !permissions?.canLeave) {
      return;
    }
    if (!window.confirm('Leave this workspace?')) {
      return;
    }
    setActionError(null);
    try {
      await removeMutation.mutateAsync(currentMember.id);
      router.replace('/workspaces');
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Unable to leave workspace');
    }
  }

  async function handleRemove(member: WorkspaceMemberView) {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) {
      return;
    }
    setActionError(null);
    try {
      await removeMutation.mutateAsync(member.id);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Unable to remove member');
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Workspace</p>
          <h1 className="text-2xl font-semibold">{workspace.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">/{workspace.slug}</p>
          <p className="mt-2 text-sm">
            Your role: <strong>{workspace.role}</strong>
          </p>
        </div>

        {permissions?.canUpdateName && (
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={nameForm.handleSubmit(async (values) => {
              setNameError(null);
              try {
                await updateNameMutation.mutateAsync(values);
              } catch (error) {
                setNameError(
                  error instanceof ApiError ? error.message : 'Unable to update workspace',
                );
              }
            })}
          >
            <label className="block flex-1 text-sm">
              Rename workspace
              <input
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2"
                {...nameForm.register('name')}
              />
            </label>
            <button
              type="submit"
              disabled={updateNameMutation.isPending}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-60"
            >
              Save
            </button>
            {nameError && <p className="text-sm text-red-600 sm:basis-full">{nameError}</p>}
          </form>
        )}

        {permissions?.canLeave && (
          <button
            type="button"
            onClick={() => void handleLeave()}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            Leave workspace
          </button>
        )}
      </div>

      {actionError && (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {workspace.members.map((member) => {
            const isSelf = member.userId === user?.id;
            const canRemove = !isSelf && permissions?.canRemoveMember(member.role);
            const canChangeRole =
              permissions?.canChangeRoles && member.role !== 'OWNER';

            return (
              <li key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {member.name}
                    {isSelf ? ' (you)' : ''}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{member.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canChangeRole ? (
                    <select
                      className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
                      value={member.role}
                      onChange={(event) => {
                        const role = event.target.value as WorkspaceRole;
                        void changeRoleMutation.mutateAsync({ memberId: member.id, role });
                      }}
                    >
                      {MEMBER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{member.role}</span>
                  )}
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => void handleRemove(member)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {permissions?.canInvite && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold">Invite people</h2>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={inviteForm.handleSubmit(async (values) => {
              setInviteError(null);
              setInviteLink(null);
              try {
                await inviteMutation.mutateAsync(values);
              } catch (error) {
                setInviteError(
                  error instanceof ApiError ? error.message : 'Unable to create invitation',
                );
              }
            })}
          >
            <input
              type="email"
              placeholder="email@example.com"
              className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              {...inviteForm.register('email')}
            />
            <select
              className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              {...inviteForm.register('role')}
            >
              <option value="MEMBER">MEMBER</option>
              {permissions.canInviteAdmin && <option value="ADMIN">ADMIN</option>}
            </select>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] disabled:opacity-60"
            >
              Invite
            </button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
          {inviteLink && (
            <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 p-4 text-sm">
              <p className="font-medium text-indigo-900">Invitation link created</p>
              <p className="mt-2 break-all text-indigo-800">{inviteLink}</p>
              <button
                type="button"
                className="mt-3 rounded-md border border-indigo-300 px-3 py-1 text-xs text-indigo-900"
                onClick={() => void navigator.clipboard.writeText(inviteLink)}
              >
                Copy link
              </button>
            </div>
          )}

          {permissions.canRevokeInvitations && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Pending invitations</h3>
              {invitationsQuery.isLoading && (
                <p className="mt-2 text-sm text-[var(--muted)]">Loading invitations…</p>
              )}
              {invitationsQuery.isError && (
                <p className="mt-2 text-sm text-red-600">Unable to load invitations.</p>
              )}
              {(invitationsQuery.data ?? []).length === 0 && invitationsQuery.isSuccess && (
                <p className="mt-2 text-sm text-[var(--muted)]">No pending invitations.</p>
              )}
              <ul className="mt-3 space-y-2">
                {(invitationsQuery.data ?? []).map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex flex-col gap-2 rounded-md border border-[var(--border)] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-[var(--muted)]">
                        {invitation.role} · invited by {invitation.inviterName}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void revokeMutation.mutateAsync(invitation.id)}
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}