export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDetail extends WorkspaceSummary {
  members: WorkspaceMemberView[];
}

export interface WorkspaceMemberView {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface UpdateWorkspaceRequest {
  name: string;
}

export interface ChangeMemberRoleRequest {
  role: WorkspaceRole;
}

export interface CreateInvitationRequest {
  email: string;
  role: Extract<WorkspaceRole, 'ADMIN' | 'MEMBER'>;
}

export interface InvitationCreatedResponse {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  invitationUrl: string;
}

export interface PendingInvitationView {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
  inviterName: string;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface AcceptInvitationResponse {
  workspace: WorkspaceSummary;
}