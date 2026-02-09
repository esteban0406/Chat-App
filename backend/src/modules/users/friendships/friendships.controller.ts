import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { ChatGateway } from '../../gateway/chat.gateway';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../auth/types';
import { SendFriendRequestDto, RespondFriendRequestDto } from './dto';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get()
  async getFriends(@Request() req: RequestWithUser) {
    return this.friendshipsService.getFriends(req.user.id);
  }

  @Get('pending')
  async getPendingRequests(@Request() req: RequestWithUser) {
    return this.friendshipsService.getPendingRequests(req.user.id);
  }

  @Get('sent')
  async getSentRequests(@Request() req: RequestWithUser) {
    return this.friendshipsService.getSentRequests(req.user.id);
  }

  @Post()
  async sendFriendRequest(
    @Request() req: RequestWithUser,
    @Body() dto: SendFriendRequestDto,
  ) {
    const friendship = await this.friendshipsService.sendFriendRequest(
      req.user.id,
      dto.receiverId,
    );
    this.chatGateway.emitToUser(
      dto.receiverId,
      'friendRequest:received',
      friendship,
    );
    return friendship;
  }

  @Patch(':id')
  async respondToRequest(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RespondFriendRequestDto,
  ) {
    const friendship = await this.friendshipsService.respondToRequest(
      id,
      req.user.id,
      dto.status,
    );
    this.chatGateway.emitToUser(
      friendship.senderId,
      'friendRequest:responded',
      friendship,
    );
    return friendship;
  }

  @Delete(':id')
  async removeFriend(@Request() req: RequestWithUser, @Param('id') id: string) {
    const result = await this.friendshipsService.removeFriend(id, req.user.id);
    this.chatGateway.emitToUser(result.otherUserId, 'friendship:removed', {
      friendshipId: id,
      removedBy: req.user.id,
    });
    return result;
  }

  @Delete(':id/cancel')
  async cancelRequest(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const result = await this.friendshipsService.cancelRequest(id, req.user.id);
    this.chatGateway.emitToUser(result.receiverId, 'friendRequest:cancelled', {
      friendshipId: id,
      cancelledBy: req.user.id,
    });
    return result;
  }
}
