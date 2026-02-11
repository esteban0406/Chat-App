jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../../../../../src/modules/gateway/chat.gateway';
import { FriendshipsController } from '../../../../../src/modules/users/friendships/friendships.controller';
import { FriendshipsService } from '../../../../../src/modules/users/friendships/friendships.service';

describe('FriendshipsController', () => {
  let controller: FriendshipsController;
  const friendshipsService = {
    getFriends: jest.fn(),
    getPendingRequests: jest.fn(),
    getSentRequests: jest.fn(),
    sendFriendRequest: jest.fn(),
    respondToRequest: jest.fn(),
    removeFriend: jest.fn(),
    cancelRequest: jest.fn(),
  };
  const chatGateway = { emitToUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendshipsController],
      providers: [
        { provide: FriendshipsService, useValue: friendshipsService },
        { provide: ChatGateway, useValue: chatGateway },
      ],
    }).compile();

    controller = module.get(FriendshipsController);
    jest.clearAllMocks();
  });

  it('sendFriendRequest delegates and emits event', async () => {
    friendshipsService.sendFriendRequest.mockResolvedValue({ id: 'f1' });
    const req = { user: { id: 'u1' } } as any;

    await expect(
      controller.sendFriendRequest(req, { receiverId: 'u2' } as any),
    ).resolves.toEqual({ id: 'f1' });

    expect(friendshipsService.sendFriendRequest).toHaveBeenCalledWith('u1', 'u2');
    expect(chatGateway.emitToUser).toHaveBeenCalled();
  });
});
