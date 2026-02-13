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
import { CreateServerDto } from '../../../../src/modules/servers/dto/create-server.dto';
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

  // --- findOne ---
  it('findOne throws when server does not exist', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.findOne('s1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findOne throws when user is not a member', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', members: [] });
    await expect(service.findOne('s1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('findOne returns server when user is a member', async () => {
    const server = { id: 's1', members: [{ userId: 'u1' }] };
    prisma.server.findUnique.mockResolvedValue(server);
    await expect(service.findOne('s1', 'u1')).resolves.toEqual(server);
  });

  // --- create ---
  it('create creates server with default channel and roles', async () => {
    prisma.server.create.mockResolvedValue({ id: 's1' });
    prisma.role.findFirst.mockResolvedValue({ id: 'r1' });
    prisma.member.create.mockResolvedValue({ id: 'm1' });
    prisma.server.findUnique.mockResolvedValue({
      id: 's1',
      members: [{ userId: 'u1' }],
    });

    const result = await service.create('u1', {
      name: 'Test Server',
    } as unknown as CreateServerDto);
    expect(prisma.server.create).toHaveBeenCalled();
    expect(prisma.role.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { serverId: 's1', name: 'Admin' } }),
    );
    expect(prisma.member.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  // --- findAllForUser ---
  it('findAllForUser returns servers', async () => {
    prisma.server.findMany.mockResolvedValue([{ id: 's1' }]);
    await expect(service.findAllForUser('u1')).resolves.toEqual([{ id: 's1' }]);
  });

  // --- joinServer ---
  it('joinServer throws when server not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.joinServer('s1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('joinServer throws when already a member', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique.mockResolvedValue({ id: 'm1' });
    await expect(service.joinServer('s1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('joinServer adds user as member', async () => {
    prisma.server.findUnique
      .mockResolvedValueOnce({ id: 's1' })
      .mockResolvedValueOnce({ id: 's1', members: [{ userId: 'u1' }] });
    prisma.member.findUnique.mockResolvedValue(null);
    prisma.role.findFirst.mockResolvedValue({ id: 'r-member' });
    prisma.member.create.mockResolvedValue({ id: 'm1' });

    const result = await service.joinServer('s1', 'u1');
    expect(prisma.member.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  // --- leaveServer ---
  it('leaveServer throws when owner tries to leave', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'u1' });
    await expect(service.leaveServer('s1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('leaveServer throws when server not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.leaveServer('s1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('leaveServer throws when not a member', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'other' });
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(service.leaveServer('s1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('leaveServer removes member successfully', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'other' });
    prisma.member.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.member.delete.mockResolvedValue({});

    const result = await service.leaveServer('s1', 'u1');
    expect(prisma.member.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(result).toEqual({ message: 'Left server successfully' });
  });

  // --- removeMember ---
  it('removeMember throws when server not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.removeMember('s1', 'm1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removeMember throws when member not found', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findFirst.mockResolvedValue(null);
    await expect(service.removeMember('s1', 'm1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removeMember throws when trying to remove yourself', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findFirst.mockResolvedValue({ id: 'm1', userId: 'u1' });
    await expect(service.removeMember('s1', 'm1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('removeMember removes member and returns updated server', async () => {
    prisma.server.findUnique
      .mockResolvedValueOnce({ id: 's1' })
      .mockResolvedValueOnce({ id: 's1', members: [{ userId: 'u1' }] });
    prisma.member.findFirst.mockResolvedValue({ id: 'm1', userId: 'u2' });
    prisma.member.delete.mockResolvedValue({});

    const result = await service.removeMember('s1', 'm1', 'u1');
    expect(prisma.member.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(result).toBeDefined();
  });

  // --- deleteServer ---
  it('deleteServer throws when server is missing', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.deleteServer('s1')).rejects.toThrow(NotFoundException);
  });

  it('deleteServer deletes successfully', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.server.delete.mockResolvedValue({});

    const result = await service.deleteServer('s1');
    expect(prisma.server.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    expect(result).toEqual({ message: 'Server deleted successfully' });
  });

  // --- updateServer ---
  it('updateServer throws when server not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(
      service.updateServer('s1', 'u1', { name: 'new' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateServer throws when non-owner tries to update', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'other' });
    await expect(
      service.updateServer('s1', 'u1', { name: 'new' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updateServer updates and returns server', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1', ownerId: 'u1' });
    prisma.server.update.mockResolvedValue({ id: 's1', name: 'new' });

    const result = await service.updateServer('s1', 'u1', { name: 'new' });
    expect(prisma.server.update).toHaveBeenCalled();
    expect(result).toEqual({ id: 's1', name: 'new' });
  });
});
