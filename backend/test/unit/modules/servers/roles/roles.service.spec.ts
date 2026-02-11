jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/database/prisma.service';
import { RolesService } from '../../../../../src/modules/servers/roles/roles.service';

describe('RolesService', () => {
  let service: RolesService;
  const prisma = {
    member: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    server: { findUnique: jest.fn() },
    role: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(RolesService);
    jest.clearAllMocks();
  });

  it('findAll throws when requester is not a member', async () => {
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(service.findAll('s1', 'u1')).rejects.toThrow(ForbiddenException);
  });

  it('update throws for default roles', async () => {
    prisma.role.findUnique.mockResolvedValue({ id: 'r1', serverId: 's1', name: 'Admin' });
    await expect(service.update('s1', 'r1', { name: 'x' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('delete throws when role has members', async () => {
    prisma.role.findUnique.mockResolvedValue({
      id: 'r1',
      serverId: 's1',
      name: 'Custom',
      _count: { members: 1 },
    });

    await expect(service.delete('s1', 'r1')).rejects.toThrow(BadRequestException);
  });

  it('assignRole throws when role is missing', async () => {
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(service.assignRole('s1', 'u2', 'r1')).rejects.toThrow(NotFoundException);
  });
});
