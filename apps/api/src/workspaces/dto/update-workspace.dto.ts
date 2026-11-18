import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateWorkspaceDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.trim().replace(/\s+/g, ' ');
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}
