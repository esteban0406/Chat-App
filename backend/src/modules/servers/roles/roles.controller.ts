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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ServerPermissionGuard } from '../../../common/rbac/server-permission.guard';
import { RequirePermission } from '../../../common/rbac/require-permission.decorator';
import { ServerPermission } from '../../../generated/prisma/client.js';
import type { RequestWithUser } from '../../auth/types';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('servers/:serverId/roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @Param('serverId') serverId: string,
  ) {
    return this.rolesService.findAll(serverId, req.user.id);
  }

  @Post()
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.MANAGE_ROLES)
  async create(
    @Param('serverId') serverId: string,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.create(serverId, createRoleDto);
  }

  @Patch(':roleId')
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.MANAGE_ROLES)
  async update(
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(serverId, roleId, updateRoleDto);
  }

  @Delete(':roleId')
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.MANAGE_ROLES)
  async delete(
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.delete(serverId, roleId);
  }

  @Post('assign')
  @UseGuards(ServerPermissionGuard)
  @RequirePermission(ServerPermission.MANAGE_ROLES)
  async assignRole(
    @Param('serverId') serverId: string,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.rolesService.assignRole(
      serverId,
      assignRoleDto.memberId,
      assignRoleDto.roleId,
    );
  }
}
