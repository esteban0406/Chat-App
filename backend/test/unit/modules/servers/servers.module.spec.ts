jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../../../../src/modules/servers/invites/server-invites.module', () => {
  const { Module } = require('@nestjs/common');
  @Module({})
  class ServerInvitesModule {}
  return { ServerInvitesModule };
});

jest.mock('../../../../src/modules/servers/roles/roles.module', () => {
  const { Module } = require('@nestjs/common');
  @Module({})
  class RolesModule {}
  return { RolesModule };
});
jest.mock('../../../../src/generated/prisma/client', () => ({
  ServerPermission: {
    DELETE_SERVER: 'DELETE_SERVER',
    REMOVE_MEMBER: 'REMOVE_MEMBER',
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
import { ServersModule } from '../../../../src/modules/servers/servers.module';
import { ServersService } from '../../../../src/modules/servers/servers.service';

describe('ServersModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({ imports: [ServersModule] })
      .overrideProvider(ServersService)
      .useValue({})
      .compile();

    expect(mod.get(ServersModule)).toBeDefined();
  });
});
