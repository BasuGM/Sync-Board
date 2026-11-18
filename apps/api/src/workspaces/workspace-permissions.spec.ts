import { canPerformAction } from './workspace-permissions';

describe('workspace permissions', () => {
  it('allows all members to view workspace and list members', () => {
    expect(canPerformAction('MEMBER', 'view_workspace')).toBe(true);
    expect(canPerformAction('ADMIN', 'list_members')).toBe(true);
  });

  it('restricts invitation creation by role', () => {
    expect(
      canPerformAction('ADMIN', 'create_invitation', {
        invitationRole: 'ADMIN',
      }),
    ).toBe(false);
    expect(
      canPerformAction('ADMIN', 'create_invitation', {
        invitationRole: 'MEMBER',
      }),
    ).toBe(true);
    expect(
      canPerformAction('OWNER', 'create_invitation', {
        invitationRole: 'ADMIN',
      }),
    ).toBe(true);
  });

  it('prevents removing owners and allows owner-only admin removal', () => {
    expect(
      canPerformAction('ADMIN', 'remove_member', { targetMemberRole: 'OWNER' }),
    ).toBe(false);
    expect(
      canPerformAction('OWNER', 'remove_member', { targetMemberRole: 'ADMIN' }),
    ).toBe(true);
    expect(
      canPerformAction('ADMIN', 'remove_member', { targetMemberRole: 'ADMIN' }),
    ).toBe(false);
  });
});
