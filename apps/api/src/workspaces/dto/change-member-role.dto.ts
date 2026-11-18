import { WorkspaceRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ChangeMemberRoleDto {
  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  role!: WorkspaceRole;
}
