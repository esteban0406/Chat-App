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
import { ServerInvitesService } from '../../../../../src/modules/servers/invites/server-invites.service';

describe('ServerInvitesService', () => {
  let service: ServerInvitesService;
  const prisma = {
    server: { findUnique: jest.fn() },
    member: { findUnique: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn() },
    role: { findFirst: jest.fn() },
    serverInvite: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerInvitesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ServerInvitesService);
    jest.clearAllMocks();
  });

  // --- sendInvite ---
  it('sendInvite prevents self invite', async () => {
    await expect(service.sendInvite('u1', 'u1', 's1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sendInvite throws when server is missing', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.sendInvite('u1', 'u2', 's1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sendInvite throws when sender is not a member', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(service.sendInvite('u1', 'u2', 's1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('sendInvite throws when receiver not found', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique.mockResolvedValueOnce({ id: 'sender-member' });
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.sendInvite('u1', 'u2', 's1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sendInvite throws when receiver is already a member', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique
      .mockResolvedValueOnce({ id: 'sender-member' })
      .mockResolvedValueOnce({ id: 'receiver-member' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    await expect(service.sendInvite('u1', 'u2', 's1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('sendInvite throws when invite already exists', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique
      .mockResolvedValueOnce({ id: 'sender-member' })
      .mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    prisma.serverInvite.findFirst.mockResolvedValue({ id: 'i1' });
    await expect(service.sendInvite('u1', 'u2', 's1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('sendInvite creates invite successfully', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique
      .mockResolvedValueOnce({ id: 'sender-member' })
      .mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    prisma.serverInvite.findFirst.mockResolvedValue(null);
    const created = { id: 'i1', senderId: 'u1', receiverId: 'u2' };
    prisma.serverInvite.create.mockResolvedValue(created);

    await expect(service.sendInvite('u1', 'u2', 's1')).resolves.toEqual(
      created,
    );
  });

  // --- acceptInvite ---
  it('acceptInvite throws when not found', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue(null);
    await expect(service.acceptInvite('i1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('acceptInvite throws when receiver is not owner of invite', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      receiverId: 'u2',
      status: 'PENDING',
      senderId: 'u3',
      serverId: 's1',
      server: {},
    });
    await expect(service.acceptInvite('i1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('acceptInvite throws when already responded', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      receiverId: 'u1',
      status: 'ACCEPTED',
      serverId: 's1',
      server: {},
    });
    await expect(service.acceptInvite('i1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('acceptInvite accepts and returns server', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      receiverId: 'u1',
      senderId: 'u2',
      status: 'PENDING',
      serverId: 's1',
      server: { id: 's1' },
    });
    prisma.role.findFirst.mockResolvedValue({ id: 'r1' });
    prisma.$transaction.mockResolvedValue([]);
    const serverData = { id: 's1', name: 'Test' };
    prisma.server.findUnique.mockResolvedValue(serverData);

    const result = await service.acceptInvite('i1', 'u1');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      server: serverData,
      senderId: 'u2',
      serverId: 's1',
    });
  });

  // --- rejectInvite ---
  it('rejectInvite throws when not found', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue(null);
    await expect(service.rejectInvite('i1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejectInvite throws when not receiver', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      receiverId: 'u2',
      status: 'PENDING',
    });
    await expect(service.rejectInvite('i1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejectInvite throws when already responded', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      receiverId: 'u1',
      status: 'ACCEPTED',
    });
    await expect(service.rejectInvite('i1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejectInvite rejects successfully', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      receiverId: 'u1',
      status: 'PENDING',
    });
    prisma.serverInvite.update.mockResolvedValue({
      id: 'i1',
      status: 'REJECTED',
    });

    await expect(service.rejectInvite('i1', 'u1')).resolves.toEqual({
      id: 'i1',
      status: 'REJECTED',
    });
  });

  // --- getPendingInvites ---
  it('getPendingInvites returns list', async () => {
    prisma.serverInvite.findMany.mockResolvedValue([{ id: 'i1' }]);
    await expect(service.getPendingInvites('u1')).resolves.toEqual([
      { id: 'i1' },
    ]);
  });

  // --- getSentInvites ---
  it('getSentInvites returns list', async () => {
    prisma.serverInvite.findMany.mockResolvedValue([{ id: 'i1' }]);
    await expect(service.getSentInvites('u1')).resolves.toEqual([{ id: 'i1' }]);
  });

  // --- cancelInvite ---
  it('cancelInvite throws when not found', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue(null);
    await expect(service.cancelInvite('i1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('cancelInvite throws when not sender', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      senderId: 'u2',
      status: 'PENDING',
    });
    await expect(service.cancelInvite('i1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('cancelInvite throws when not pending', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      senderId: 'u1',
      status: 'ACCEPTED',
    });
    await expect(service.cancelInvite('i1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('cancelInvite cancels successfully', async () => {
    prisma.serverInvite.findUnique.mockResolvedValue({
      id: 'i1',
      senderId: 'u1',
      receiverId: 'u2',
      serverId: 's1',
      status: 'PENDING',
    });
    prisma.serverInvite.delete.mockResolvedValue({});

    const result = await service.cancelInvite('i1', 'u1');
    expect(result).toEqual({
      message: 'Invite cancelled',
      receiverId: 'u2',
      serverId: 's1',
    });
  });
});
