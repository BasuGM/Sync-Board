import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  AcceptInvitationResponse,
  InvitationCreatedResponse,
  PendingInvitationView,
  WorkspaceDetail,
  WorkspaceMemberView,
  WorkspaceSummary,
} from '@syncboard/shared';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ChangeMemberRoleDto } from './dto/change-member-role.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InvitationsService } from './invitations.service';
import { WorkspacesService } from './workspaces.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Post('workspaces')
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceSummary> {
    return this.workspacesService.create(user.userId, dto);
  }

  @Get('workspaces')
  list(@CurrentUser() user: JwtPayloadUser): Promise<WorkspaceSummary[]> {
    return this.workspacesService.listForUser(user.userId);
  }

  @Get('workspaces/:workspaceId')
  getOne(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceDetail> {
    return this.workspacesService.getById(user.userId, workspaceId);
  }

  @Patch('workspaces/:workspaceId')
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceSummary> {
    return this.workspacesService.updateName(user.userId, workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/members')
  listMembers(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceMemberView[]> {
    return this.workspacesService.listMembers(user.userId, workspaceId);
  }

  @Patch('workspaces/:workspaceId/members/:memberId')
  changeRole(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: ChangeMemberRoleDto,
  ): Promise<WorkspaceMemberView> {
    return this.workspacesService.changeMemberRole(
      user.userId,
      workspaceId,
      memberId,
      dto,
    );
  }

  @Delete('workspaces/:workspaceId/members/:memberId')
  removeMember(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ): Promise<{ success: true }> {
    return this.workspacesService.removeMember(
      user.userId,
      workspaceId,
      memberId,
    );
  }

  @Post('workspaces/:workspaceId/invitations')
  createInvitation(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationCreatedResponse> {
    return this.invitationsService.create(user.userId, workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/invitations')
  listInvitations(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<PendingInvitationView[]> {
    return this.invitationsService.listPending(user.userId, workspaceId);
  }

  @Delete('workspaces/:workspaceId/invitations/:invitationId')
  revokeInvitation(
    @CurrentUser() user: JwtPayloadUser,
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<{ success: true }> {
    return this.invitationsService.revoke(
      user.userId,
      workspaceId,
      invitationId,
    );
  }

  @Post('invitations/accept')
  acceptInvitation(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponse> {
    return this.invitationsService.accept(user.userId, user.email, dto);
  }
}
