import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ServerInvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async sendInvite(senderId: string, receiverId: string, serverId: string) {
    // Validate not inviting self
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot invite yourself');
    }

    // Check if server exists
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Check if sender is a member of the server
    const senderMember = await this.prisma.member.findUnique({
      where: {
        userId_serverId: { userId: senderId, serverId },
      },
    });

    if (!senderMember) {
      throw new ForbiddenException('You must be a member to invite others');
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if receiver is already a member
    const existingMember = await this.prisma.member.findUnique({
      where: {
        userId_serverId: { userId: receiverId, serverId },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this server');
    }

    // Check for existing pending invite
    const existingInvite = await this.prisma.serverInvite.findFirst({
      where: {
        receiverId,
        serverId,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new ConflictException('User already has a pending invite for this server');
    }

    return this.prisma.serverInvite.create({
      data: {
        senderId,
        receiverId,
        serverId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, username: true, avatarUrl: true },
        },
        server: {
          select: { id: true, name: true, iconUrl: true },
        },
      },
    });
  }

  async acceptInvite(inviteId: string, userId: string) {
    const invite = await this.prisma.serverInvite.findUnique({
      where: { id: inviteId },
      include: { server: true },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.receiverId !== userId) {
      throw new ForbiddenException('You can only accept your own invites');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Invite has already been responded to');
    }

    // Update invite status and add user as member
    await this.prisma.$transaction([
      this.prisma.serverInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.member.create({
        data: {
          userId,
          serverId: invite.serverId,
        },
      }),
    ]);

    return this.prisma.server.findUnique({
      where: { id: invite.serverId },
      include: {
        owner: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true, status: true },
            },
          },
        },
        channels: true,
      },
    });
  }

  async rejectInvite(inviteId: string, userId: string) {
    const invite = await this.prisma.serverInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.receiverId !== userId) {
      throw new ForbiddenException('You can only reject your own invites');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Invite has already been responded to');
    }

    return this.prisma.serverInvite.update({
      where: { id: inviteId },
      data: { status: 'REJECTED' },
    });
  }

  async getPendingInvites(userId: string) {
    return this.prisma.serverInvite.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
        server: {
          select: { id: true, name: true, iconUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentInvites(userId: string) {
    return this.prisma.serverInvite.findMany({
      where: {
        senderId: userId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: { id: true, username: true, avatarUrl: true },
        },
        server: {
          select: { id: true, name: true, iconUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvite(inviteId: string, userId: string) {
    const invite = await this.prisma.serverInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.senderId !== userId) {
      throw new ForbiddenException('You can only cancel invites you sent');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending invites');
    }

    await this.prisma.serverInvite.delete({
      where: { id: inviteId },
    });

    return { message: 'Invite cancelled' };
  }
}
