import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AcceptInvitationResponse,
  InvitationCreatedResponse,
  PendingInvitationView,
} from '@syncboard/shared';
import { AppConfig } from '../config/app.config';
import { WorkspaceConfig } from '../config/workspace.config';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { normalizeEmail } from './normalize-email.util';
import {
  generateInvitationToken,
  hashInvitationToken,
  invitationExpiresAt,
} from './workspace.tokens';
import { WorkspaceAccessService } from './workspace-access.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly configService: ConfigService,
  ) {}

  private get appConfig(): AppConfig {
    return this.configService.get<AppConfig>('app', { infer: true })!;
  }

  private get workspaceConfig(): WorkspaceConfig {
    return this.configService.get<WorkspaceConfig>('workspace', {
      infer: true,
    })!;
  }

  private isPending(invitation: {
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  }): boolean {
    const now = new Date();
    return (
      invitation.acceptedAt === null &&
      invitation.revokedAt === null &&
      invitation.expiresAt > now
    );
  }

  async create(
    userId: string,
    workspaceId: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationCreatedResponse> {
    const membership = await this.access.getMembershipOrThrow(
      userId,
      workspaceId,
    );
    this.access.assertAction(membership, 'create_invitation', {
      invitationRole: dto.role,
    });

    const email = normalizeEmail(dto.email);

    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, user: { email } },
    });
    if (existingMember) {
      throw new ConflictException('User is already a workspace member');
    }

    const pending = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (pending) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);
    const expiresAt = invitationExpiresAt(
      this.workspaceConfig.invitationExpiresDays,
    );

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        inviterId: userId,
        email,
        role: dto.role,
        tokenHash,
        expiresAt,
      },
    });

    const webOrigin = this.appConfig.corsOrigin.replace(/\/$/, '');
    const invitationUrl = `${webOrigin}/invitations/accept?token=${encodeURIComponent(rawToken)}`;

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
      invitationUrl,
    };
  }

  async listPending(
    userId: string,
    workspaceId: string,
  ): Promise<PendingInvitationView[]> {
    const membership = await this.access.getMembershipOrThrow(
      userId,
      workspaceId,
    );
    this.access.assertAction(membership, 'revoke_invitation');

    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { inviter: true },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      inviterName: inv.inviter.name,
    }));
  }

  async revoke(
    userId: string,
    workspaceId: string,
    invitationId: string,
  ): Promise<{ success: true }> {
    const membership = await this.access.getMembershipOrThrow(
      userId,
      workspaceId,
    );
    this.access.assertAction(membership, 'revoke_invitation');

    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (!this.isPending(invitation)) {
      throw new BadRequestException('Invitation is no longer pending');
    }

    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async accept(
    userId: string,
    userEmail: string,
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponse> {
    const tokenHash = hashInvitationToken(dto.token);
    const normalizedEmail = normalizeEmail(userEmail);

    const result = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        Array<{
          id: string;
          workspaceId: string;
          email: string;
          role: 'OWNER' | 'ADMIN' | 'MEMBER';
          expiresAt: Date;
          acceptedAt: Date | null;
          revokedAt: Date | null;
        }>
      >`
        SELECT "id", "workspaceId", "email", "role", "expiresAt", "acceptedAt", "revokedAt"
        FROM "WorkspaceInvitation"
        WHERE "tokenHash" = ${tokenHash}
        FOR UPDATE
      `;

      const invitation = locked[0];
      if (!invitation) {
        throw new BadRequestException('Invalid invitation');
      }
      if (invitation.revokedAt) {
        throw new BadRequestException('Invitation has been revoked');
      }
      if (invitation.acceptedAt) {
        throw new BadRequestException('Invitation has already been accepted');
      }
      if (invitation.expiresAt <= new Date()) {
        throw new BadRequestException('Invitation has expired');
      }
      if (normalizeEmail(invitation.email) !== normalizedEmail) {
        throw new ForbiddenException(
          'Authenticated email does not match the invitation',
        );
      }

      const existingMember = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId,
          },
        },
      });
      if (existingMember) {
        throw new ConflictException(
          'You are already a member of this workspace',
        );
      }

      await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      });

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      const workspace = await tx.workspace.findUniqueOrThrow({
        where: { id: invitation.workspaceId },
        include: { _count: { select: { members: true } } },
      });

      return {
        workspace,
        role: invitation.role,
        memberCount: workspace._count.members,
      };
    });

    return {
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        slug: result.workspace.slug,
        role: result.role,
        memberCount: result.memberCount,
        createdAt: result.workspace.createdAt.toISOString(),
        updatedAt: result.workspace.updatedAt.toISOString(),
      },
    };
  }
}
