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
      providers: [
        FriendshipsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(FriendshipsService);
    jest.clearAllMocks();
  });

  // --- sendFriendRequest ---
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

  it('sendFriendRequest throws when already friends', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    prisma.friendship.findFirst.mockResolvedValue({ status: 'ACCEPTED' });
    await expect(service.sendFriendRequest('u1', 'u2')).rejects.toThrow(
      ConflictException,
    );
  });

  it('sendFriendRequest throws when previously rejected', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    prisma.friendship.findFirst.mockResolvedValue({ status: 'REJECTED' });
    await expect(service.sendFriendRequest('u1', 'u2')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('sendFriendRequest creates request successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    prisma.friendship.findFirst.mockResolvedValue(null);
    const created = { id: 'f1', senderId: 'u1', receiverId: 'u2' };
    prisma.friendship.create.mockResolvedValue(created);

    await expect(service.sendFriendRequest('u1', 'u2')).resolves.toEqual(
      created,
    );
    expect(prisma.friendship.create).toHaveBeenCalled();
  });

  // --- respondToRequest ---
  it('respondToRequest throws when not found', async () => {
    prisma.friendship.findUnique.mockResolvedValue(null);
    await expect(
      service.respondToRequest('f1', 'u1', 'ACCEPTED'),
    ).rejects.toThrow(NotFoundException);
  });

  it('respondToRequest blocks non receiver', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      senderId: 'u1',
      receiverId: 'u2',
      status: 'PENDING',
    });
    await expect(
      service.respondToRequest('f1', 'u3', 'ACCEPTED'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('respondToRequest throws when already responded', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      receiverId: 'u2',
      status: 'ACCEPTED',
    });
    await expect(
      service.respondToRequest('f1', 'u2', 'ACCEPTED'),
    ).rejects.toThrow(BadRequestException);
  });

  it('respondToRequest accepts request', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      receiverId: 'u2',
      status: 'PENDING',
    });
    prisma.friendship.update.mockResolvedValue({
      id: 'f1',
      status: 'ACCEPTED',
    });

    await expect(
      service.respondToRequest('f1', 'u2', 'ACCEPTED'),
    ).resolves.toEqual({
      id: 'f1',
      status: 'ACCEPTED',
    });
  });

  // --- getPendingRequests ---
  it('getPendingRequests returns list', async () => {
    prisma.friendship.findMany.mockResolvedValue([{ id: 'f1' }]);
    await expect(service.getPendingRequests('u1')).resolves.toEqual([
      { id: 'f1' },
    ]);
  });

  // --- getSentRequests ---
  it('getSentRequests returns list', async () => {
    prisma.friendship.findMany.mockResolvedValue([{ id: 'f1' }]);
    await expect(service.getSentRequests('u1')).resolves.toEqual([
      { id: 'f1' },
    ]);
  });

  // --- getFriends ---
  it('getFriends returns correct friend from each friendship', async () => {
    prisma.friendship.findMany.mockResolvedValue([
      {
        senderId: 'u1',
        receiverId: 'u2',
        sender: { id: 'u1', username: 'alice' },
        receiver: { id: 'u2', username: 'bob' },
      },
      {
        senderId: 'u3',
        receiverId: 'u1',
        sender: { id: 'u3', username: 'carol' },
        receiver: { id: 'u1', username: 'alice' },
      },
    ]);

    const result = await service.getFriends('u1');
    expect(result).toEqual([
      { id: 'u2', username: 'bob' },
      { id: 'u3', username: 'carol' },
    ]);
  });

  // --- removeFriend ---
  it('removeFriend throws when not found', async () => {
    prisma.friendship.findUnique.mockResolvedValue(null);
    await expect(service.removeFriend('f1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removeFriend throws when not a party', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      senderId: 'u2',
      receiverId: 'u3',
    });
    await expect(service.removeFriend('f1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('removeFriend removes friendship and returns otherUserId', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      senderId: 'u1',
      receiverId: 'u2',
    });
    prisma.friendship.delete.mockResolvedValue({});

    const result = await service.removeFriend('f1', 'u1');
    expect(prisma.friendship.delete).toHaveBeenCalledWith({
      where: { id: 'f1' },
    });
    expect(result).toEqual({
      message: 'Friendship removed',
      otherUserId: 'u2',
    });
  });

  // --- cancelRequest ---
  it('cancelRequest throws when not found', async () => {
    prisma.friendship.findUnique.mockResolvedValue(null);
    await expect(service.cancelRequest('f1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('cancelRequest throws when not sender', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      senderId: 'u2',
      status: 'PENDING',
    });
    await expect(service.cancelRequest('f1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('cancelRequest throws when not pending', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      senderId: 'u1',
      status: 'ACCEPTED',
    });
    await expect(service.cancelRequest('f1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('cancelRequest cancels successfully', async () => {
    prisma.friendship.findUnique.mockResolvedValue({
      id: 'f1',
      senderId: 'u1',
      receiverId: 'u2',
      status: 'PENDING',
    });
    prisma.friendship.delete.mockResolvedValue({});

    const result = await service.cancelRequest('f1', 'u1');
    expect(result).toEqual({
      message: 'Friend request cancelled',
      receiverId: 'u2',
    });
  });
});
