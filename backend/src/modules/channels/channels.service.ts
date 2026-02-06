import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureMembership(serverId: string, userId: string) {
    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: { userId, serverId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return member;
  }

  async create(userId: string, createChannelDto: CreateChannelDto) {
    const { serverId, name, type } = createChannelDto;

    // Check server exists
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Check membership
    await this.ensureMembership(serverId, userId);

    return this.prisma.channel.create({
      data: {
        name: name.trim(),
        type: type || 'TEXT',
        serverId,
      },
    });
  }

  async findAllForServer(serverId: string, userId: string) {
    // Check server exists
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Check membership
    await this.ensureMembership(serverId, userId);

    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check membership
    await this.ensureMembership(channel.serverId, userId);

    return channel;
  }

  async update(
    channelId: string,
    userId: string,
    updateChannelDto: UpdateChannelDto,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check membership
    await this.ensureMembership(channel.serverId, userId);

    return this.prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(updateChannelDto.name && { name: updateChannelDto.name.trim() }),
        ...(updateChannelDto.type && { type: updateChannelDto.type }),
      },
    });
  }

  async delete(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Only server owner can delete channels
    if (channel.server.ownerId !== userId) {
      throw new ForbiddenException('Only the server owner can delete channels');
    }

    // Prevent deleting the last channel
    const channelCount = await this.prisma.channel.count({
      where: { serverId: channel.serverId },
    });

    if (channelCount <= 1) {
      throw new BadRequestException(
        'Cannot delete the last channel in a server',
      );
    }

    await this.prisma.channel.delete({
      where: { id: channelId },
    });

    return { message: 'Channel deleted successfully' };
  }
}
