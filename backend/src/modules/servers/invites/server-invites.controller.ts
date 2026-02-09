import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServerInvitesService } from './server-invites.service';
import { ChatGateway } from '../../gateway/chat.gateway';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../auth/types';
import { SendServerInviteDto } from './dto';
import { ServerPermissionGuard } from '../../../common/rbac/server-permission.guard';
import { RequirePermission } from '../../../common/rbac/require-permission.decorator';
import { ServerPermission } from '../../../generated/prisma/client';

@Controller('server-invites')
@UseGuards(JwtAuthGuard)
export class ServerInvitesController {
  constructor(
    private readonly serverInvitesService: ServerInvitesService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('pending')
  async getPendingInvites(@Request() req: RequestWithUser) {
    return this.serverInvitesService.getPendingInvites(req.user.id);
  }

  @Get('sent')
  async getSentInvites(@Request() req: RequestWithUser) {
    return this.serverInvitesService.getSentInvites(req.user.id);
  }

  @Post()
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.INVITE_MEMBER, {
    from: 'body',
    field: 'serverId',
  })
  async sendInvite(
    @Request() req: RequestWithUser,
    @Body() dto: SendServerInviteDto,
  ) {
    const invite = await this.serverInvitesService.sendInvite(
      req.user.id,
      dto.receiverId,
      dto.serverId,
    );
    this.chatGateway.emitToUser(
      dto.receiverId,
      'serverInvite:received',
      invite,
    );
    return invite;
  }

  @Post(':id/accept')
  async acceptInvite(@Request() req: RequestWithUser, @Param('id') id: string) {
    const result = await this.serverInvitesService.acceptInvite(
      id,
      req.user.id,
    );
    this.chatGateway.emitToUser(result.senderId, 'serverInvite:accepted', {
      inviteId: id,
      receiverId: req.user.id,
      serverId: result.serverId,
      serverName: result.server?.name,
    });
    return result.server;
  }

  @Post(':id/reject')
  async rejectInvite(@Request() req: RequestWithUser, @Param('id') id: string) {
    const invite = await this.serverInvitesService.rejectInvite(
      id,
      req.user.id,
    );
    this.chatGateway.emitToUser(invite.senderId, 'serverInvite:rejected', {
      inviteId: id,
      receiverId: req.user.id,
      serverId: invite.serverId,
    });
    return invite;
  }

  @Delete(':id')
  async cancelInvite(@Request() req: RequestWithUser, @Param('id') id: string) {
    const result = await this.serverInvitesService.cancelInvite(
      id,
      req.user.id,
    );
    this.chatGateway.emitToUser(result.receiverId, 'serverInvite:cancelled', {
      inviteId: id,
      cancelledBy: req.user.id,
      serverId: result.serverId,
    });
    return result;
  }
}
