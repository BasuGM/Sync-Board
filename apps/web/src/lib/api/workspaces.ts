import type {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  ChangeMemberRoleRequest,
  CreateInvitationRequest,
  CreateWorkspaceRequest,
  InvitationCreatedResponse,
  PendingInvitationView,
  UpdateWorkspaceRequest,
  WorkspaceDetail,
  WorkspaceMemberView,
  WorkspaceRole,
  WorkspaceSummary,
} from '@syncboard/shared';
import { apiRequest } from '@/lib/api/client';

export function listWorkspaces(): Promise<WorkspaceSummary[]> {
  return apiRequest<WorkspaceSummary[]>('/workspaces');
}

export function createWorkspace(
  body: CreateWorkspaceRequest,
): Promise<WorkspaceSummary> {
  return apiRequest<WorkspaceSummary>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getWorkspace(workspaceId: string): Promise<WorkspaceDetail> {
  return apiRequest<WorkspaceDetail>(`/workspaces/${workspaceId}`);
}

export function updateWorkspace(
  workspaceId: string,
  body: UpdateWorkspaceRequest,
): Promise<WorkspaceSummary> {
  return apiRequest<WorkspaceSummary>(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMemberView[]> {
  return apiRequest<WorkspaceMemberView[]>(`/workspaces/${workspaceId}/members`);
}

export function changeMemberRole(
  workspaceId: string,
  memberId: string,
  body: ChangeMemberRoleRequest,
): Promise<WorkspaceMemberView> {
  return apiRequest<WorkspaceMemberView>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    { method: 'DELETE' },
  );
}

export function createInvitation(
  workspaceId: string,
  body: CreateInvitationRequest,
): Promise<InvitationCreatedResponse> {
  return apiRequest<InvitationCreatedResponse>(
    `/workspaces/${workspaceId}/invitations`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function listPendingInvitations(
  workspaceId: string,
): Promise<PendingInvitationView[]> {
  return apiRequest<PendingInvitationView[]>(
    `/workspaces/${workspaceId}/invitations`,
  );
}

export function revokeInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(
    `/workspaces/${workspaceId}/invitations/${invitationId}`,
    { method: 'DELETE' },
  );
}

export function acceptInvitation(
  body: AcceptInvitationRequest,
): Promise<AcceptInvitationResponse> {
  return apiRequest<AcceptInvitationResponse>('/invitations/accept', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function workspacePermissions(role: WorkspaceRole) {
  return {
    canUpdateName: role === 'OWNER' || role === 'ADMIN',
    canInvite: role === 'OWNER' || role === 'ADMIN',
    canInviteAdmin: role === 'OWNER',
    canRevokeInvitations: role === 'OWNER' || role === 'ADMIN',
    canChangeRoles: role === 'OWNER',
    canRemoveMember: (targetRole: WorkspaceRole) => {
      if (targetRole === 'OWNER') {
        return false;
      }
      if (targetRole === 'ADMIN') {
        return role === 'OWNER';
      }
      return role === 'OWNER' || role === 'ADMIN';
    },
    canLeave: role === 'ADMIN' || role === 'MEMBER',
  };
}