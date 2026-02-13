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
jest.mock('../../../../../src/generated/prisma/client', () => ({
  ServerPermission: { INVITE_MEMBER: 'INVITE_MEMBER' },
}));
jest.mock('../../../../../src/common/rbac/server-permission.guard', () => ({
  ServerPermissionGuard: class ServerPermissionGuard {
    canActivate() {
      return true;
    }
  },
}));
jest.mock(
  '../../../../../src/modules/servers/invites/server-invites.controller',
  () => ({
    ServerInvitesController: class ServerInvitesController {},
  }),
);

import { Test } from '@nestjs/testing';
import { ServerInvitesModule } from '../../../../../src/modules/servers/invites/server-invites.module';
import { ServerInvitesService } from '../../../../../src/modules/servers/invites/server-invites.service';

describe('ServerInvitesModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({
      imports: [ServerInvitesModule],
    })
      .overrideProvider(ServerInvitesService)
      .useValue({})
      .compile();

    expect(mod.get(ServerInvitesModule)).toBeDefined();
  });
});
