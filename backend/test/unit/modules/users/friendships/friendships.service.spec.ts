jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/database/prisma.service';
import { FriendshipsService } from '../../../../../src/modules/users/friendships/friendships.service';

describe('FriendshipsService', () => {
  let service: FriendshipsService;
  const prisma = {
    user: { findUnique: jest.fn() },
    friendship: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendshipsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(FriendshipsService);
    jest.clearAllMocks();
  });

  it('sendFriendRequest rejects self requests', async () => {
    await expect(service.sendFriendRequest('u1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sendFriendRequest throws when receiver does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.sendFriendRequest('u1', 'u2')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sendFriendRequest throws when already pending', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    prisma.friendship.findFirst.mockResolvedValue({ status: 'PENDING' });

    await expect(service.sendFriendRequest('u1', 'u2')).rejects.toThrow(
      ConflictException,
    );
  });

  it('respondToRequest blocks non receiver', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      senderId: 'u1',
      receiverId: 'u2',
      status: 'PENDING',
    });

    await expect(service.respondToRequest('f1', 'u3', 'ACCEPTED')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
