import { IsUUID } from 'class-validator';

export class SendServerInviteDto {
  @IsUUID()
  receiverId: string;

  @IsUUID()
  serverId: string;
}
