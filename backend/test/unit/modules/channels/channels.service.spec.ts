jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../src/database/prisma.service';
import { ChannelsService } from '../../../../src/modules/channels/channels.service';
import { CreateChannelDto } from '../../../../src/modules/channels/dto/create-channel.dto';

describe('ChannelsService', () => {
  let service: ChannelsService;
  const prisma = {
    server: { findUnique: jest.fn() },
    member: { findUnique: jest.fn() },
    channel: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ChannelsService);
    jest.clearAllMocks();
  });

  // Helper
  const mockMembership = () => {
    prisma.member.findUnique.mockResolvedValue({ id: 'm1' });
  };

  // --- create ---
  it('create throws when server is not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(
      service.create('u1', 's1', {
        name: 'general',
        type: 'TEXT',
      } as unknown as CreateChannelDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('create throws when not a member', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(
      service.create('u1', 's1', {
        name: 'general',
        type: 'TEXT',
      } as unknown as CreateChannelDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('create creates channel', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    mockMembership();
    prisma.channel.create.mockResolvedValue({ id: 'c1', name: 'general' });

    const result = await service.create('u1', 's1', {
      name: 'general',
      type: 'TEXT',
    } as any);
    expect(result).toEqual({ id: 'c1', name: 'general' });
  });

  // --- findAllForServer ---
  it('findAllForServer returns ordered channels', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    mockMembership();
    prisma.channel.findMany.mockResolvedValue([{ id: 'c1' }]);
    await expect(service.findAllForServer('s1', 'u1')).resolves.toEqual([
      { id: 'c1' },
    ]);
  });

  it('findAllForServer throws when server not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);
    await expect(service.findAllForServer('s1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // --- findOne ---
  it('findOne returns channel', async () => {
    prisma.channel.findUnique.mockResolvedValue({
      id: 'c1',
      server: { id: 's1' },
    });
    mockMembership();
    const result = await service.findOne('s1', 'c1', 'u1');
    expect(result.id).toBe('c1');
  });

  it('findOne throws when channel not found', async () => {
    prisma.channel.findUnique.mockResolvedValue(null);
    await expect(service.findOne('s1', 'c1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findOne throws when not a member', async () => {
    prisma.channel.findUnique.mockResolvedValue({
      id: 'c1',
      server: { id: 's1' },
    });
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(service.findOne('s1', 'c1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  // --- update ---
  it('update updates channel', async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: 'c1' });
    mockMembership();
    prisma.channel.update.mockResolvedValue({ id: 'c1', name: 'updated' });

    const result = await service.update('s1', 'c1', 'u1', { name: 'updated' });
    expect(result.name).toBe('updated');
  });

  it('update throws when channel not found', async () => {
    prisma.channel.findUnique.mockResolvedValue(null);
    await expect(
      service.update('s1', 'c1', 'u1', { name: 'updated' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('update throws when not a member', async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(
      service.update('s1', 'c1', 'u1', { name: 'updated' }),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- delete ---
  it('delete throws when channel not found', async () => {
    prisma.channel.findUnique.mockResolvedValue(null);
    await expect(service.delete('c1')).rejects.toThrow(NotFoundException);
  });

  it('delete throws when it is the last channel', async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
    prisma.channel.count.mockResolvedValue(1);
    await expect(service.delete('c1')).rejects.toThrow(BadRequestException);
  });

  it('delete deletes channel successfully', async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
    prisma.channel.count.mockResolvedValue(2);
    prisma.channel.delete.mockResolvedValue({});

    const result = await service.delete('c1');
    expect(prisma.channel.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(result).toEqual({ message: 'Channel deleted successfully' });
  });
});
