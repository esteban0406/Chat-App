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

import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../../../../../src/modules/servers/roles/roles.controller';
import { RolesService } from '../../../../../src/modules/servers/roles/roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  const rolesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assignRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: rolesService }],
    }).compile();

    controller = module.get(RolesController);
    jest.clearAllMocks();
  });

  it('assignRole delegates to service', async () => {
    rolesService.assignRole.mockResolvedValue({ id: 'm1' });

    await expect(
      controller.assignRole('s1', { memberId: 'u2', roleId: 'r1' } as any),
    ).resolves.toEqual({ id: 'm1' });

    expect(rolesService.assignRole).toHaveBeenCalledWith('s1', 'u2', 'r1');
  });
});
