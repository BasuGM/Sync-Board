import type { WorkspaceRole } from '@prisma/client';

export type WorkspaceAction =
  | 'view_workspace'
  | 'list_members'
  | 'update_workspace_name'
  | 'create_invitation'
  | 'revoke_invitation'
  | 'change_member_role'
  | 'remove_member'
  | 'leave_workspace';

export function canPerformAction(
  actorRole: WorkspaceRole,
  action: WorkspaceAction,
  context?: {
    invitationRole?: WorkspaceRole;
    targetMemberRole?: WorkspaceRole;
  },
): boolean {
  switch (action) {
    case 'view_workspace':
    case 'list_members':
      return (
        actorRole === 'OWNER' || actorRole === 'ADMIN' || actorRole === 'MEMBER'
      );
    case 'update_workspace_name':
      return actorRole === 'OWNER' || actorRole === 'ADMIN';
    case 'create_invitation': {
      const inviteRole = context?.invitationRole;
      if (!inviteRole || inviteRole === 'OWNER') {
        return false;
      }
      if (actorRole === 'OWNER') {
        return inviteRole === 'ADMIN' || inviteRole === 'MEMBER';
      }
      if (actorRole === 'ADMIN') {
        return inviteRole === 'MEMBER';
      }
      return false;
    }
    case 'revoke_invitation':
      return actorRole === 'OWNER' || actorRole === 'ADMIN';
    case 'change_member_role':
      return actorRole === 'OWNER';
    case 'remove_member': {
      const target = context?.targetMemberRole;
      if (!target || target === 'OWNER') {
        return false;
      }
      if (target === 'ADMIN') {
        return actorRole === 'OWNER';
      }
      return actorRole === 'OWNER' || actorRole === 'ADMIN';
    }
    case 'leave_workspace':
      return actorRole === 'ADMIN' || actorRole === 'MEMBER';
    default:
      return false;
  }
}

export function roleRank(role: WorkspaceRole): number {
  switch (role) {
    case 'OWNER':
      return 3;
    case 'ADMIN':
      return 2;
    case 'MEMBER':
      return 1;
    default:
      return 0;
  }
}
