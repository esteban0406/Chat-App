jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('../../../../../src/generated/prisma/client', () => ({
  ServerPermission: { MANAGE_ROLES: 'MANAGE_ROLES' },
}));
jest.mock('../../../../../src/common/rbac/server-permission.guard', () => ({
  ServerPermissionGuard: class ServerPermissionGuard {
    canActivate() {
      return true;
    }
  },
}));

import { Test } from '@nestjs/testing';
import { RolesModule } from '../../../../../src/modules/servers/roles/roles.module';
import { RolesService } from '../../../../../src/modules/servers/roles/roles.service';

describe('RolesModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({ imports: [RolesModule] })
      .overrideProvider(RolesService)
      .useValue({})
      .compile();

    expect(mod.get(RolesModule)).toBeDefined();
  });
});
