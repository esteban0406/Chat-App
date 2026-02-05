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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../auth/types';
import { SendFriendRequestDto, RespondFriendRequestDto } from './dto';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

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
    return this.friendshipsService.sendFriendRequest(req.user.id, dto.receiverId);
  }

  @Patch(':id')
  async respondToRequest(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return this.friendshipsService.respondToRequest(id, req.user.id, dto.status);
  }

  @Delete(':id')
  async removeFriend(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.friendshipsService.removeFriend(id, req.user.id);
  }

  @Delete(':id/cancel')
  async cancelRequest(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.friendshipsService.cancelRequest(id, req.user.id);
  }
}
