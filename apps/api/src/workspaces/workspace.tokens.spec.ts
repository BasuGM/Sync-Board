import {
  generateInvitationToken,
  hashInvitationToken,
  invitationExpiresAt,
} from './workspace.tokens';

describe('workspace invitation tokens', () => {
  it('generates high-entropy tokens and stable hashes', () => {
    const raw = generateInvitationToken();
    expect(raw.length).toBeGreaterThanOrEqual(32);
    const hashA = hashInvitationToken(raw);
    const hashB = hashInvitationToken(raw);
    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(raw);
  });

  it('computes invitation expiration in the future', () => {
    const expiresAt = invitationExpiresAt(7);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
