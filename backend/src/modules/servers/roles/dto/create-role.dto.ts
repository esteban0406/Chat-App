import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ServerPermission } from '../../../../generated/prisma/client.js';

export class CreateRoleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsArray()
  @IsEnum(ServerPermission, { each: true })
  permissions: ServerPermission[];
}
