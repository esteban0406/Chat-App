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
import { CreateRoleDto } from '../../../../../src/modules/servers/roles/dto/create-role.dto';
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

  // --- findAll ---
  it('findAll throws when requester is not a member', async () => {
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(service.findAll('s1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('findAll returns roles', async () => {
    prisma.member.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.role.findMany.mockResolvedValue([{ id: 'r1', name: 'Admin' }]);
    await expect(service.findAll('s1', 'u1')).resolves.toEqual([
      { id: 'r1', name: 'Admin' },
    ]);
  });

  // --- create ---
  it('create throws when server not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(
      service.create('s1', {
        name: 'Mod',
        permissions: [],
      } as unknown as CreateRoleDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('create creates role', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.role.create.mockResolvedValue({ id: 'r1', name: 'Mod' });
    const result = await service.create('s1', {
      name: 'Mod',
      permissions: [],
    } as unknown as CreateRoleDto);
    expect(result).toEqual({ id: 'r1', name: 'Mod' });
  });

  // --- update ---
  it('update throws for default roles', async () => {
    prisma.role.findUnique.mockResolvedValue({
      id: 'r1',
      serverId: 's1',
      name: 'Admin',
    });
    await expect(service.update('s1', 'r1', { name: 'x' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('update throws when role not found', async () => {
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(service.update('s1', 'r1', { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update throws when role belongs to different server', async () => {
    prisma.role.findUnique.mockResolvedValue({
      id: 'r1',
      serverId: 's2',
      name: 'Custom',
    });
    await expect(service.update('s1', 'r1', { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update updates role successfully', async () => {
    prisma.role.findUnique.mockResolvedValue({
      id: 'r1',
      serverId: 's1',
      name: 'Custom',
    });
    prisma.role.update.mockResolvedValue({ id: 'r1', name: 'Updated' });

    const result = await service.update('s1', 'r1', { name: 'Updated' });
    expect(result).toEqual({ id: 'r1', name: 'Updated' });
  });

  // --- delete ---
  it('delete throws when role has members', async () => {
    prisma.role.findUnique.mockResolvedValue({
      id: 'r1',
      serverId: 's1',
      name: 'Custom',
      _count: { members: 1 },
    });
    await expect(service.delete('s1', 'r1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('delete throws when role not found', async () => {
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(service.delete('s1', 'r1')).rejects.toThrow(NotFoundException);
  });

  it('delete throws for default roles', async () => {
    prisma.role.findUnique.mockResolvedValue({
      id: 'r1',
      serverId: 's1',
      name: 'Member',
      _count: { members: 0 },
    });
    await expect(service.delete('s1', 'r1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('delete deletes role successfully', async () => {
    prisma.role.findUnique.mockResolvedValue({
      id: 'r1',
      serverId: 's1',
      name: 'Custom',
      _count: { members: 0 },
    });
    prisma.role.delete.mockResolvedValue({});

    const result = await service.delete('s1', 'r1');
    expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    expect(result).toEqual({ message: 'Role deleted successfully' });
  });

  // --- assignRole ---
  it('assignRole throws when role is missing', async () => {
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(service.assignRole('s1', 'u2', 'r1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('assignRole throws when role belongs to different server', async () => {
    prisma.role.findUnique.mockResolvedValue({ id: 'r1', serverId: 's2' });
    await expect(service.assignRole('s1', 'u2', 'r1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('assignRole throws when member not found', async () => {
    prisma.role.findUnique.mockResolvedValue({ id: 'r1', serverId: 's1' });
    prisma.member.findFirst.mockResolvedValue(null);
    await expect(service.assignRole('s1', 'u2', 'r1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('assignRole assigns role successfully', async () => {
    prisma.role.findUnique.mockResolvedValue({ id: 'r1', serverId: 's1' });
    prisma.member.findFirst.mockResolvedValue({ id: 'm1' });
    prisma.member.update.mockResolvedValue({
      id: 'm1',
      roleId: 'r1',
      user: { id: 'u2' },
      role: { id: 'r1' },
    });

    const result = await service.assignRole('s1', 'u2', 'r1');
    expect(prisma.member.update).toHaveBeenCalled();
    expect(result.roleId).toBe('r1');
  });
});
