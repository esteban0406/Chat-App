import { IsString, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @IsUUID()
  memberId: string;

  @IsString()
  @IsUUID()
  roleId: string;
}
