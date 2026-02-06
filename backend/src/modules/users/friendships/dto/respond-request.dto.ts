import { IsIn } from 'class-validator';

export class RespondFriendRequestDto {
  @IsIn(['ACCEPTED', 'REJECTED'])
  status: 'ACCEPTED' | 'REJECTED';
}
