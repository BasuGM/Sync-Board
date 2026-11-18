import { registerAs } from '@nestjs/config';

export interface WorkspaceConfig {
  invitationExpiresDays: number;
}

export default registerAs('workspace', (): WorkspaceConfig => ({
  invitationExpiresDays: Number(
    process.env.WORKSPACE_INVITATION_EXPIRES_DAYS ?? 7,
  ),
}));
