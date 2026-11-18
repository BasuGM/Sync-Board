import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@prisma/client';
import type {
  WorkspaceDetail,
  WorkspaceMemberView,
  WorkspaceSummary,
} from '@syncboard/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeMemberRoleDto } from './dto/change-member-role.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { slugifyWorkspaceName, uniqueSlugSuffix } from './workspace-slug.util';
import { WorkspaceAccessService } from './workspace-access.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  private toSummary(
    workspace: Workspace,
    role: WorkspaceRole,
    memberCount: number,
  ): WorkspaceSummary {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role,
      memberCount,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }

  private toMemberView(
    member: WorkspaceMember & {
      user: { id: string; name: string; email: string };
    },
  ): WorkspaceMemberView {
    return {
      id: member.id,
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
    };
  }

  async create(
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<WorkspaceSummary> {
    const baseSlug = slugifyWorkspaceName(dto.name);
    let slug = baseSlug;

    const workspace = await this.prisma.$transaction(async (tx) => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const existing = await tx.workspace.findUnique({ where: { slug } });
        if (!existing) {
          break;
        }
        slug = `${baseSlug}-${uniqueSlugSuffix()}`;
      }

      const created = await tx.workspace.create({
        data: { name: dto.name, slug },
      });
      await tx.workspaceMember.create({
        data: {
          workspaceId: created.id,
          userId,
          role: 'OWNER',
        },
      });
      return created;
    });

    return this.toSummary(workspace, 'OWNER', 1);
  }

  async listForUser(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { workspace: { name: 'asc' } },
    });

    return memberships.map((m) =>
      this.toSummary(m.workspace, m.role, m.workspace._count.members),
    );
  }

  async getById(userId: string, workspaceId: string): Promise<WorkspaceDetail> {
    const membership = await this.access.getMembershipOrThrow(
      userId,
      workspaceId,
    );
    this.access.assertAction(membership, 'view_workspace');

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: true },
          orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
        },
        _count: { select: { members: true } },
      },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      ...this.toSummary(workspace, membership.role, workspace._count.members),
      members: workspace.members.map((m) => this.toMemberView(m)),
    };
  }

  async updateName(
    userId: string,
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceSummary> {
    const membership = await this.access.getMembershipOrThrow(
      userId,
      workspaceId,
    );
    this.access.assertAction(membership, 'update_workspace_name');

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: dto.name },
      include: { _count: { select: { members: true } } },
    });

    return this.toSummary(workspace, membership.role, workspace._count.members);
  }

  async listMembers(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMemberView[]> {
    const membership = await this.access.getMembershipOrThrow(
      userId,
      workspaceId,
    );
    this.access.assertAction(membership, 'list_members');

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
    });

    return members.map((m) => this.toMemberView(m));
  }

  async changeMemberRole(
    userId: string,
    workspaceId: string,
    memberId: string,
    dto: ChangeMemberRoleDto,
  ): Promise<WorkspaceMemberView> {
    if (dto.role === 'OWNER') {
      throw new BadRequestException('Owner role cannot be assigned');
    }

    const actor = await this.access.getMembershipOrThrow(userId, workspaceId);
    this.access.assertAction(actor, 'change_member_role');

    const target = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      include: { user: true },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }
    if (target.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the workspace owner role');
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: target.id },
      data: { role: dto.role },
      include: { user: true },
    });

    return this.toMemberView(updated);
  }

  async removeMember(
    userId: string,
    workspaceId: string,
    memberId: string,
  ): Promise<{ success: true }> {
    const actor = await this.access.getMembershipOrThrow(userId, workspaceId);

    const target = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }

    const isSelf = target.userId === userId;
    if (isSelf) {
      this.access.assertAction(actor, 'leave_workspace');
    } else {
      this.access.assertAction(actor, 'remove_member', {
        targetMemberRole: target.role,
      });
    }

    if (target.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.prisma.workspaceMember.delete({ where: { id: target.id } });
    return { success: true };
  }
}
