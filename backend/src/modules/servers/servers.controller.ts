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
import { ServersService } from './servers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types';
import { CreateServerDto, UpdateServerDto } from './dto';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createServerDto: CreateServerDto,
  ) {
    return this.serversService.create(req.user.id, createServerDto);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.serversService.findAllForUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.serversService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateServerDto: UpdateServerDto,
  ) {
    return this.serversService.updateServer(id, req.user.id, updateServerDto);
  }

  @Delete(':id')
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.serversService.deleteServer(id, req.user.id);
  }

  @Post(':id/join')
  async join(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.serversService.joinServer(id, req.user.id);
  }

  @Post(':id/leave')
  async leave(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.serversService.leaveServer(id, req.user.id);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.serversService.removeMember(id, memberId, req.user.id);
  }
}
