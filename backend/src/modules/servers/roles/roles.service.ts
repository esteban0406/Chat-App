import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const DEFAULT_ROLE_NAMES = ['Admin', 'Member'];

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(serverId: string, userId: string) {
    // Verify user is a member of the server
    const member = await this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return this.prisma.role.findMany({
      where: { serverId },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(serverId: string, createRoleDto: CreateRoleDto) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name.trim(),
        color: createRoleDto.color,
        permissions: createRoleDto.permissions,
        serverId,
      },
    });
  }

  async update(serverId: string, roleId: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.serverId !== serverId) {
      throw new NotFoundException('Role not found in this server');
    }

    if (DEFAULT_ROLE_NAMES.includes(role.name)) {
      throw new ForbiddenException('Cannot edit default roles');
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(updateRoleDto.name && { name: updateRoleDto.name.trim() }),
        ...(updateRoleDto.color !== undefined && {
          color: updateRoleDto.color,
        }),
        ...(updateRoleDto.permissions && {
          permissions: updateRoleDto.permissions,
        }),
      },
    });
  }

  async delete(serverId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { members: true } } },
    });

    if (!role || role.serverId !== serverId) {
      throw new NotFoundException('Role not found in this server');
    }

    if (DEFAULT_ROLE_NAMES.includes(role.name)) {
      throw new ForbiddenException('Cannot delete default roles');
    }

    if (role._count.members > 0) {
      throw new BadRequestException(
        'Cannot delete a role that has members assigned. Reassign them first.',
      );
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    return { message: 'Role deleted successfully' };
  }

  async assignRole(serverId: string, memberId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.serverId !== serverId) {
      throw new NotFoundException('Role not found in this server');
    }

    const member = await this.prisma.member.findFirst({
      where: { userId: memberId, serverId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this server');
    }

    return this.prisma.member.update({
      where: { id: member.id },
      data: { roleId },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        role: true,
      },
    });
  }
}
