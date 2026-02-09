import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ServerPermission } from '../../../../generated/prisma/client';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ServerPermission, { each: true })
  permissions?: ServerPermission[];
}
