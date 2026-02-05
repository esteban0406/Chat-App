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

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return this.channelsService.create(req.user.id, createChannelDto);
  }

  @Get('server/:serverId')
  async findAllForServer(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
  ) {
    return this.channelsService.findAllForServer(serverId, req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.channelsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, req.user.id, updateChannelDto);
  }

  @Delete(':id')
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.channelsService.delete(id, req.user.id);
  }
}
