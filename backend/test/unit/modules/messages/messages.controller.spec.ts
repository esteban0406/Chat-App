jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../../src/modules/auth/types';
import { MessagesController } from '../../../../src/modules/messages/messages.controller';
import { MessagesService } from '../../../../src/modules/messages/messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  const messagesService = {
    create: jest.fn(),
    findAllForChannel: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: messagesService }],
    }).compile();

    controller = module.get(MessagesController);
    jest.clearAllMocks();
  });

  it('findAllForChannel parses query and delegates', async () => {
    messagesService.findAllForChannel.mockResolvedValue({ messages: [] });
    const req = { user: { id: 'u1' } } as unknown as RequestWithUser;

    await expect(
      controller.findAllForChannel(req, 'c1', '20', 'cursor1'),
    ).resolves.toEqual({ messages: [] });

    expect(messagesService.findAllForChannel).toHaveBeenCalledWith('c1', 'u1', {
      limit: 20,
      cursor: 'cursor1',
    });
  });
});
