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
import { ServerPermissionGuard } from '../../common/rbac/server-permission.guard';
import { RequirePermission } from '../../common/rbac/require-permission.decorator';
import { ServerPermission } from '../../generated/prisma/client';

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

  @Get(':serverId')
  async findOne(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.findOne(serverId, req.user.id);
  }

  @Patch(':serverId')
  async update(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
    @Body() updateServerDto: UpdateServerDto,
  ) {
    return this.serversService.updateServer(
      serverId,
      req.user.id,
      updateServerDto,
    );
  }

  @Delete(':serverId')
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.DELETE_SERVER)
  async delete(@Param('serverId') serverId: string) {
    return this.serversService.deleteServer(serverId);
  }

  @Post(':serverId/join')
  async join(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.joinServer(serverId, req.user.id);
  }

  @Post(':serverId/leave')
  async leave(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.leaveServer(serverId, req.user.id);
  }

  @Delete(':serverId/members/:memberId')
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.REMOVE_MEMBER)
  async removeMember(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.serversService.removeMember(serverId, memberId, req.user.id);
  }
}
