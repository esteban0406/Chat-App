jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../../../../src/modules/messages/messages.module', () => {
  const { Module } = require('@nestjs/common');
  @Module({})
  class MessagesModule {}
  return { MessagesModule };
});

import { Test } from '@nestjs/testing';
import { ChatGateway } from '../../../../src/modules/gateway/chat.gateway';
import { GatewayModule } from '../../../../src/modules/gateway/gateway.module';

describe('GatewayModule', () => {
  it('compiles with mocked gateway provider', async () => {
    const mod = await Test.createTestingModule({ imports: [GatewayModule] })
      .overrideProvider(ChatGateway)
      .useValue({})
      .compile();

    expect(mod.get(GatewayModule)).toBeDefined();
  });
});
