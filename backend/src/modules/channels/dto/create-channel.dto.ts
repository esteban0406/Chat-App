import { IsString, IsUUID, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsIn(['TEXT', 'VOICE'])
  type?: 'TEXT' | 'VOICE';

  @IsUUID()
  serverId: string;
}
