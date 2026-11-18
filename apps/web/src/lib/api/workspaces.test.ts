import { describe, expect, it } from 'vitest';
import { workspacePermissions } from '@/lib/api/workspaces';

describe('workspacePermissions', () => {
  it('exposes role-based UI capabilities', () => {
    const owner = workspacePermissions('OWNER');
    const admin = workspacePermissions('ADMIN');
    const member = workspacePermissions('MEMBER');

    expect(owner.canInviteAdmin).toBe(true);
    expect(admin.canInviteAdmin).toBe(false);
    expect(admin.canRemoveMember('MEMBER')).toBe(true);
    expect(admin.canRemoveMember('ADMIN')).toBe(false);
    expect(member.canInvite).toBe(false);
    expect(member.canLeave).toBe(true);
  });
});