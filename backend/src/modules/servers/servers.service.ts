import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServerDto } from './dto/create-server.dto';
import { ServerPermission } from '../../generated/prisma/client';

const ALL_PERMISSIONS = Object.values(ServerPermission);

@Injectable()
export class ServersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, createServerDto: CreateServerDto) {
    // Create server with default channel and default roles
    const server = await this.prisma.server.create({
      data: {
        name: createServerDto.name.trim(),
        iconUrl: createServerDto.iconUrl,
        ownerId,
        channels: {
          create: {
            name: 'general',
            type: 'TEXT',
          },
        },
        roles: {
          create: [
            { name: 'Admin', permissions: ALL_PERMISSIONS },
            { name: 'Member', permissions: [] },
          ],
        },
      },
    });

    // Look up the Admin role to assign to the owner
    const adminRole = await this.prisma.role.findFirst({
      where: { serverId: server.id, name: 'Admin' },
    });

    // Create owner as first member with Admin role
    await this.prisma.member.create({
      data: {
        userId: ownerId,
        serverId: server.id,
        roleId: adminRole!.id,
      },
    });

    return this.findOne(server.id, ownerId);
  }

  async findAllForUser(userId: string) {
    return this.prisma.server.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                status: true,
              },
            },
            role: true,
          },
        },
        channels: true,
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async findOne(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        owner: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                status: true,
              },
            },
            role: true,
          },
        },
        channels: true,
        roles: true,
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Check if user is a member
    const isMember = server.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return server;
  }

  async joinServer(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.member.findUnique({
      where: {
        userId_serverId: { userId, serverId },
      },
    });

    if (existingMember) {
      throw new BadRequestException('Already a member of this server');
    }

    // Find the default Member role for this server
    const memberRole = await this.prisma.role.findFirst({
      where: { serverId, name: 'Member' },
    });

    // Add as member with Member role
    await this.prisma.member.create({
      data: {
        userId,
        serverId,
        roleId: memberRole?.id,
      },
    });

    return this.findOne(serverId, userId);
  }

  async leaveServer(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.ownerId === userId) {
      throw new BadRequestException(
        'Owner cannot leave the server. Transfer ownership or delete it.',
      );
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: { userId, serverId },
      },
    });

    if (!member) {
      throw new BadRequestException('You are not a member of this server');
    }

    await this.prisma.member.delete({
      where: { id: member.id },
    });

    return { message: 'Left server successfully' };
  }

  async removeMember(serverId: string, memberId: string, requesterId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        serverId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.userId === requesterId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    await this.prisma.member.delete({
      where: { id: member.id },
    });

    return this.findOne(serverId, requesterId);
  }

  async deleteServer(serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Prisma cascade will delete members, channels, messages, roles, and invites
    await this.prisma.server.delete({
      where: { id: serverId },
    });

    return { message: 'Server deleted successfully' };
  }

  async updateServer(
    serverId: string,
    userId: string,
    data: { name?: string; iconUrl?: string },
  ) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can update the server');
    }

    return this.prisma.server.update({
      where: { id: serverId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl }),
      },
      include: {
        owner: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                status: true,
              },
            },
            role: true,
          },
        },
        channels: true,
      },
    });
  }
}
