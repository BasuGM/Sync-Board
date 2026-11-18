import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InvitationsService, WorkspaceAccessService],
})
export class WorkspacesModule {}
