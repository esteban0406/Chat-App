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
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(MessagesService);
    jest.clearAllMocks();
  });

  // Helper to mock ensureMembership success
  const mockMembership = () => {
    prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
    prisma.member.findUnique.mockResolvedValue({ id: 'm1' });
  };

  // --- create ---
  it('create throws when channel does not exist', async () => {
    prisma.channel.findUnique.mockResolvedValue(null);
    await expect(
      service.create('u1', { channelId: 'c1', content: 'hello' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('create throws when user is not a member', async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(
      service.create('u1', { channelId: 'c1', content: 'hello' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('create creates message successfully', async () => {
    mockMembership();
    const msg = { id: 'm1', content: 'hello', author: { id: 'u1' } };
    prisma.message.create.mockResolvedValue(msg);

    const result = await service.create('u1', {
      channelId: 'c1',
      content: 'hello',
    });
    expect(prisma.message.create).toHaveBeenCalled();
    expect(result).toEqual(msg);
  });

  // --- findAllForChannel ---
  it('findAllForChannel returns paginated messages', async () => {
    mockMembership();
    const messages = Array.from({ length: 3 }, (_, i) => ({ id: `m${i}` }));
    prisma.message.findMany.mockResolvedValue(messages);

    const result = await service.findAllForChannel('c1', 'u1', { limit: 50 });
    expect(result.messages).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('findAllForChannel returns hasMore when more messages exist', async () => {
    mockMembership();
    // Returns limit+1 messages to indicate there are more
    const messages = Array.from({ length: 4 }, (_, i) => ({ id: `m${i}` }));
    prisma.message.findMany.mockResolvedValue(messages);

    const result = await service.findAllForChannel('c1', 'u1', { limit: 3 });
    expect(result.messages).toHaveLength(3);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('m2');
  });

  // --- findOne ---
  it('findOne returns message', async () => {
    const msg = { id: 'm1', channelId: 'c1', channel: { serverId: 's1' } };
    prisma.message.findUnique.mockResolvedValue(msg);
    mockMembership();

    const result = await service.findOne('m1', 'u1');
    expect(result).toEqual(msg);
  });

  it('findOne throws when message not found', async () => {
    prisma.message.findUnique.mockResolvedValue(null);
    await expect(service.findOne('m1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // --- update ---
  it('update throws when non-author tries to edit', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', authorId: 'u2' });
    await expect(service.update('m1', 'u1', 'new')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('update throws when message not found', async () => {
    prisma.message.findUnique.mockResolvedValue(null);
    await expect(service.update('m1', 'u1', 'new')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update updates message content', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', authorId: 'u1' });
    prisma.message.update.mockResolvedValue({ id: 'm1', content: 'new' });

    const result = await service.update('m1', 'u1', 'new');
    expect(prisma.message.update).toHaveBeenCalled();
    expect(result.content).toBe('new');
  });

  // --- delete ---
  it('delete throws when message not found', async () => {
    prisma.message.findUnique.mockResolvedValue(null);
    await expect(service.delete('m1', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('delete allows author to delete', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1',
      authorId: 'u1',
      channel: { server: { ownerId: 'other' } },
    });
    prisma.message.delete.mockResolvedValue({});

    const result = await service.delete('m1', 'u1');
    expect(prisma.message.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(result).toEqual({ message: 'Message deleted successfully' });
  });

  it('delete allows server owner to delete', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1',
      authorId: 'u2',
      channel: { server: { ownerId: 'u1' } },
    });
    prisma.message.delete.mockResolvedValue({});

    const result = await service.delete('m1', 'u1');
    expect(result).toEqual({ message: 'Message deleted successfully' });
  });

  it('delete throws when unauthorized user tries to delete', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1',
      authorId: 'u2',
      channel: { server: { ownerId: 'u3' } },
    });

    await expect(service.delete('m1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
