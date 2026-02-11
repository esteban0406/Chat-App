jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../src/database/prisma.service';
import { MessagesService } from '../../../../src/modules/messages/messages.service';

describe('MessagesService', () => {
  let service: MessagesService;
  const prisma = {
    channel: { findUnique: jest.fn() },
    member: { findUnique: jest.fn() },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(MessagesService);
    jest.clearAllMocks();
  });

  it('create throws when channel does not exist', async () => {
    prisma.channel.findUnique.mockResolvedValue(null);

    await expect(
      service.create('u1', { channelId: 'c1', content: 'hello' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('update throws when non-author tries to edit', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', authorId: 'u2' });

    await expect(service.update('m1', 'u1', 'new')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
