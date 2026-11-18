import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { WorkspaceMember, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  canPerformAction,
  type WorkspaceAction,
} from './workspace-permissions';

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembershipOrThrow(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }
    return membership;
  }

  assertAction(
    membership: WorkspaceMember,
    action: WorkspaceAction,
    context?: {
      invitationRole?: WorkspaceRole;
      targetMemberRole?: WorkspaceRole;
    },
  ): void {
    if (!canPerformAction(membership.role, action, context)) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }
  }
}
