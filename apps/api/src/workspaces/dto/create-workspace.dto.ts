import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.trim().replace(/\s+/g, ' ');
  })
  @IsString()
  @IsNotEmpty({ message: 'Workspace name is required' })
  @MinLength(2, { message: 'Workspace name must be at least 2 characters' })
  @MaxLength(100)
  name!: string;
}
