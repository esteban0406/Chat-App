jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../src/database/prisma.service';
import { ChannelsService } from '../../../../src/modules/channels/channels.service';

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
      providers: [ChannelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ChannelsService);
    jest.clearAllMocks();
  });

  it('create throws when server is not found', async () => {
    prisma.server.findUnique.mockResolvedValue(null);

    await expect(
      service.create('u1', 's1', { name: 'general', type: 'TEXT' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('findAllForServer returns ordered channels', async () => {
    prisma.server.findUnique.mockResolvedValue({ id: 's1' });
    prisma.member.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.channel.findMany.mockResolvedValue([{ id: 'c1' }]);

    await expect(service.findAllForServer('s1', 'u1')).resolves.toEqual([{ id: 'c1' }]);
  });
});
