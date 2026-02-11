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
});
