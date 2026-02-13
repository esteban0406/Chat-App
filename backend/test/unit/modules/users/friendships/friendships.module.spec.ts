jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../../../../../src/modules/gateway/gateway.module', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Module } = require('@nestjs/common');
  class ChatGateway {}
  @Module({ providers: [ChatGateway], exports: [ChatGateway] })
  class GatewayModule {}
  return { GatewayModule, ChatGateway };
});
jest.mock(
  '../../../../../src/modules/users/friendships/friendships.controller',
  () => ({
    FriendshipsController: class FriendshipsController {},
  }),
);

import { Test } from '@nestjs/testing';
import { FriendshipsModule } from '../../../../../src/modules/users/friendships/friendships.module';
import { FriendshipsService } from '../../../../../src/modules/users/friendships/friendships.service';

describe('FriendshipsModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({
      imports: [FriendshipsModule],
    })
      .overrideProvider(FriendshipsService)
      .useValue({})
      .compile();

    expect(mod.get(FriendshipsModule)).toBeDefined();
  });
});
