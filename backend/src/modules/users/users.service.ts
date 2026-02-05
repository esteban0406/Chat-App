import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string) {
    if (!username?.trim()) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        username: {
          contains: username.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 10,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.username && {
          username: updateUserDto.username.trim(),
        }),
        ...(updateUserDto.avatarUrl && { avatarUrl: updateUserDto.avatarUrl }),
        ...(updateUserDto.avatarPublicId && {
          avatarPublicId: updateUserDto.avatarPublicId,
        }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateStatus(id: string, status: 'ONLINE' | 'OFFLINE') {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
