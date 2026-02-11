jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../../../../src/generated/prisma/client', () => ({
  ServerPermission: {
    CREATE_CHANNEL: 'CREATE_CHANNEL',
    DELETE_CHANNEL: 'DELETE_CHANNEL',
    DELETE_SERVER: 'DELETE_SERVER',
    INVITE_MEMBER: 'INVITE_MEMBER',
    MANAGE_ROLES: 'MANAGE_ROLES',
    REMOVE_MEMBER: 'REMOVE_MEMBER',
  },
}));

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../src/database/prisma.service';
import { ServersService } from '../../../../src/modules/servers/servers.service';

describe('ServersService', () => {
  let service: ServersService;
  const prisma = {
    server: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    role: { findFirst: jest.fn() },
    member: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ServersService);
    jest.clearAllMocks();
  });

  it('findOne throws when server does not exist', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.findOne('s1', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('findOne throws when user is not a member', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', members: [] });
    await expect(service.findOne('s1', 'u1')).rejects.toThrow(ForbiddenException);
  });

  it('leaveServer throws when owner tries to leave', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'u1' });
    await expect(service.leaveServer('s1', 'u1')).rejects.toThrow(BadRequestException);
  });

  it('deleteServer throws when server is missing', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.deleteServer('s1')).rejects.toThrow(NotFoundException);
  });
});
