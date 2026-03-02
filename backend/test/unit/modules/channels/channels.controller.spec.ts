jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../../../../src/generated/prisma/client', () => ({
  ServerPermission: {
    CREATE_CHANNEL: 'CREATE_CHANNEL',
    DELETE_CHANNEL: 'DELETE_CHANNEL',
  },
}));
jest.mock('../../../../src/common/rbac/server-permission.guard', () => ({
  ServerPermissionGuard: class ServerPermissionGuard {
    canActivate() {
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../../src/modules/auth/types';
import { ChannelsController } from '../../../../src/modules/channels/channels.controller';
import { ChannelsService } from '../../../../src/modules/channels/channels.service';
import { ChatGateway } from '../../../../src/modules/gateway/chat.gateway';
import { CreateChannelDto } from '../../../../src/modules/channels/dto/create-channel.dto';

describe('ChannelsController', () => {
  let controller: ChannelsController;
  const channelsService = {
    create: jest.fn(),
    findAllForServer: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getMemberIds: jest.fn().mockResolvedValue([]),
  };
  const chatGateway = { emitToUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [
        { provide: ChannelsService, useValue: channelsService },
        { provide: ChatGateway, useValue: chatGateway },
      ],
    }).compile();

    controller = module.get(ChannelsController);
    jest.clearAllMocks();
  });

  it('create delegates to service', async () => {
    const req = { user: { id: 'u1' } } as unknown as RequestWithUser;
    const dto = {
      name: 'general',
      type: 'TEXT',
    } as unknown as CreateChannelDto;
    channelsService.create.mockResolvedValue({ id: 'c1' });

    await expect(controller.create(req, 's1', dto)).resolves.toEqual({
      id: 'c1',
    });
    expect(channelsService.create).toHaveBeenCalledWith('u1', 's1', dto);
  });
});
