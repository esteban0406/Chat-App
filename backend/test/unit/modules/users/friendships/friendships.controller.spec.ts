jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../../../src/modules/auth/types';
import { ChatGateway } from '../../../../../src/modules/gateway/chat.gateway';
import { FriendshipsController } from '../../../../../src/modules/users/friendships/friendships.controller';
import { SendFriendRequestDto } from '../../../../../src/modules/users/friendships/dto/send-request.dto';
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
    const req = { user: { id: 'u1' } } as unknown as RequestWithUser;

    await expect(
      controller.sendFriendRequest(req, {
        receiverId: 'u2',
      } as unknown as SendFriendRequestDto),
    ).resolves.toEqual({ id: 'f1' });

    expect(friendshipsService.sendFriendRequest).toHaveBeenCalledWith(
      'u1',
      'u2',
    );
    expect(chatGateway.emitToUser).toHaveBeenCalled();
  });
});
