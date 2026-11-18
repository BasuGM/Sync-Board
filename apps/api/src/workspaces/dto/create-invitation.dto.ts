import { WorkspaceRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsEnum(WorkspaceRole, {
    message: 'role must be ADMIN or MEMBER',
  })
  role!: Exclude<WorkspaceRole, 'OWNER'>;
}
