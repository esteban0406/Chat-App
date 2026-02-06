import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, receiverId: string) {
    // Validate not sending to self
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check for existing friendship in either direction
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ConflictException('Friend request already pending');
      }
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('Already friends');
      }
      if (existing.status === 'REJECTED') {
        throw new ForbiddenException('Cannot send request');
      }
    }

    return this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        receiver: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
    });
  }

  async respondToRequest(
    friendshipId: string,
    userId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the receiver can respond to the request
    if (friendship.receiverId !== userId) {
      throw new ForbiddenException('Cannot respond to this request');
    }

    if (friendship.status !== 'PENDING') {
      throw new BadRequestException('Request already responded');
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        receiver: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
    });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentRequests(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        senderId: userId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
        receiver: {
          select: { id: true, username: true, avatarUrl: true, status: true },
        },
      },
    });

    // Return the other user in each friendship
    return friendships.map((friendship) =>
      friendship.senderId === userId ? friendship.receiver : friendship.sender,
    );
  }

  async removeFriend(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Either party can remove the friendship
    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      throw new ForbiddenException('Cannot remove this friendship');
    }

    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return { message: 'Friendship removed' };
  }

  async cancelRequest(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the sender can cancel the request
    if (friendship.senderId !== userId) {
      throw new ForbiddenException('Cannot cancel this request');
    }

    if (friendship.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending requests');
    }

    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return { message: 'Friend request cancelled' };
  }
}
