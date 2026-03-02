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

import { Test } from '@nestjs/testing';
import { ChannelsModule } from '../../../../src/modules/channels/channels.module';
import { ChannelsService } from '../../../../src/modules/channels/channels.service';
import { MessagesService } from '../../../../src/modules/messages/messages.service';
import { ChatGateway } from '../../../../src/modules/gateway/chat.gateway';

describe('ChannelsModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({ imports: [ChannelsModule] })
      .overrideProvider(ChannelsService)
      .useValue({})
      .overrideProvider(MessagesService)
      .useValue({})
      .overrideProvider(ChatGateway)
      .useValue({})
      .compile();

    expect(mod.get(ChannelsModule)).toBeDefined();
  });
});
