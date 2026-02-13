jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../../../../src/generated/prisma/client', () => ({
  ServerPermission: {
    CREATE_CHANNEL: 'CREATE_CHANNEL',
    DELETE_CHANNEL: 'DELETE_CHANNEL',
  },
}));

import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../src/database/prisma.service';
import { ServerPermissionGuard } from '../../../../src/common/rbac/server-permission.guard';

describe('ServerPermissionGuard', () => {
  let guard: ServerPermissionGuard;
  const reflector = { get: jest.fn() };
  const prisma = {
    server: { findUnique: jest.fn() },
    member: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerPermissionGuard,
        { provide: Reflector, useValue: reflector },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get(ServerPermissionGuard);
    jest.clearAllMocks();
  });

  const makeContext = (userId: string, serverId: string): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: userId },
          params: { serverId },
        }),
      }),
    }) as unknown as ExecutionContext;

  it('returns true when no permission decorator is set', async () => {
    reflector.get.mockReturnValue(undefined);
    await expect(guard.canActivate(makeContext('u1', 's1'))).resolves.toBe(
      true,
    );
  });

  it('returns true when user is server owner', async () => {
    reflector.get.mockReturnValue('CREATE_CHANNEL');
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'u1' });

    await expect(guard.canActivate(makeContext('u1', 's1'))).resolves.toBe(
      true,
    );
  });

  it('throws NotFoundException when server does not exist', async () => {
    reflector.get.mockReturnValue('CREATE_CHANNEL');
    prisma.server.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(makeContext('u1', 's1'))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when user is not a member', async () => {
    reflector.get.mockReturnValue('CREATE_CHANNEL');
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'other' });
    prisma.member.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(makeContext('u1', 's1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when member role lacks permission', async () => {
    reflector.get.mockReturnValue('CREATE_CHANNEL');
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'other' });
    prisma.member.findUnique.mockResolvedValue({
      id: 'm1',
      role: { permissions: ['DELETE_CHANNEL'] },
    });

    await expect(guard.canActivate(makeContext('u1', 's1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when member has no role', async () => {
    reflector.get.mockReturnValue('CREATE_CHANNEL');
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'other' });
    prisma.member.findUnique.mockResolvedValue({ id: 'm1', role: null });

    await expect(guard.canActivate(makeContext('u1', 's1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns true when member role has the required permission', async () => {
    reflector.get.mockReturnValue('CREATE_CHANNEL');
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'other' });
    prisma.member.findUnique.mockResolvedValue({
      id: 'm1',
      role: { permissions: ['CREATE_CHANNEL', 'DELETE_CHANNEL'] },
    });

    await expect(guard.canActivate(makeContext('u1', 's1'))).resolves.toBe(
      true,
    );
  });
});
