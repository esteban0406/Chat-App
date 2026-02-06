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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../auth/types';
import { SendServerInviteDto } from './dto';

@Controller('server-invites')
@UseGuards(JwtAuthGuard)
export class ServerInvitesController {
  constructor(private readonly serverInvitesService: ServerInvitesService) {}

  @Get('pending')
  async getPendingInvites(@Request() req: RequestWithUser) {
    return this.serverInvitesService.getPendingInvites(req.user.id);
  }

  @Get('sent')
  async getSentInvites(@Request() req: RequestWithUser) {
    return this.serverInvitesService.getSentInvites(req.user.id);
  }

  @Post()
  async sendInvite(
    @Request() req: RequestWithUser,
    @Body() dto: SendServerInviteDto,
  ) {
    return this.serverInvitesService.sendInvite(
      req.user.id,
      dto.receiverId,
      dto.serverId,
    );
  }

  @Post(':id/accept')
  async acceptInvite(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.serverInvitesService.acceptInvite(id, req.user.id);
  }

  @Post(':id/reject')
  async rejectInvite(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.serverInvitesService.rejectInvite(id, req.user.id);
  }

  @Delete(':id')
  async cancelInvite(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.serverInvitesService.cancelInvite(id, req.user.id);
  }
}
