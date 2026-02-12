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
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types';
import { CreateChannelDto, UpdateChannelDto } from './dto';
import { ServerPermissionGuard } from '../../common/rbac/server-permission.guard';
import { RequirePermission } from '../../common/rbac/require-permission.decorator';
import { ServerPermission } from '../../generated/prisma/client.js';

@Controller('servers/:serverId/channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.CREATE_CHANNEL)
  async create(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return this.channelsService.create(req.user.id, serverId, createChannelDto);
  }

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
  ) {
    return this.channelsService.findAllForServer(serverId, req.user.id);
  }

  @Get(':channelId')
  async findOne(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
  ) {
    return this.channelsService.findOne(serverId, channelId, req.user.id);
  }

  @Patch(':channelId')
  async update(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(
      serverId,
      channelId,
      req.user.id,
      updateChannelDto,
    );
  }

  @Delete(':channelId')
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.DELETE_CHANNEL)
  async delete(@Param('channelId') channelId: string) {
    return this.channelsService.delete(channelId);
  }
}
