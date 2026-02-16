jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock(
  '../../../../src/modules/servers/invites/server-invites.module',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const { Module } = require('@nestjs/common');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    @Module({})
    class ServerInvitesModule {}
    return { ServerInvitesModule };
  },
);

jest.mock('../../../../src/modules/servers/roles/roles.module', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const { Module } = require('@nestjs/common');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Module({})
  class RolesModule {}
  return { RolesModule };
});
jest.mock('@prisma/client', () => ({
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
