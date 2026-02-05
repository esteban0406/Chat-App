import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureMembership(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: { userId, serverId: channel.serverId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return { channel, member };
  }

  async create(userId: string, createMessageDto: CreateMessageDto) {
    const { channelId, content } = createMessageDto;

    // Check membership
    await this.ensureMembership(channelId, userId);

    const message = await this.prisma.message.create({
      data: {
        content: content.trim(),
        authorId: userId,
        channelId,
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
    });

    return message;
  }

  async findAllForChannel(
    channelId: string,
    userId: string,
    options?: { limit?: number; cursor?: string },
  ) {
    // Check membership
    await this.ensureMembership(channelId, userId);

    const limit = options?.limit || 50;
    const cursor = options?.cursor;

    const messages = await this.prisma.message.findMany({
      where: { channelId },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor
      }),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      messages: items.reverse(), // Return in chronological order
      nextCursor,
      hasMore,
    };
  }

  async findOne(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        channel: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check membership
    await this.ensureMembership(message.channelId, userId);

    return message;
  }

  async update(messageId: string, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only author can edit their message
    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content: content.trim() },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
    });
  }

  async delete(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: { server: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Author or server owner can delete
    const isAuthor = message.authorId === userId;
    const isServerOwner = message.channel.server.ownerId === userId;

    if (!isAuthor && !isServerOwner) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted successfully' };
  }
}
