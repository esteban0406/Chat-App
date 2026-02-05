import { IsIn } from 'class-validator';

export class RespondFriendRequestDto {
  @IsIn(['ACCEPTED', 'BLOCKED'])
  status: 'ACCEPTED' | 'BLOCKED';
}
