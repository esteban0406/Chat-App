jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

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

import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../../src/modules/auth/types';
import { CreateServerDto } from '../../../../src/modules/servers/dto/create-server.dto';
import { ServersController } from '../../../../src/modules/servers/servers.controller';
import { ServersService } from '../../../../src/modules/servers/servers.service';

describe('ServersController', () => {
  let controller: ServersController;
  const serversService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    updateServer: jest.fn(),
    deleteServer: jest.fn(),
    joinServer: jest.fn(),
    leaveServer: jest.fn(),
    removeMember: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServersController],
      providers: [{ provide: ServersService, useValue: serversService }],
    }).compile();

    controller = module.get(ServersController);
    jest.clearAllMocks();
  });

  it('create delegates to service', async () => {
    serversService.create.mockResolvedValue({ id: 's1' });
    const req = { user: { id: 'u1' } } as unknown as RequestWithUser;
    const dto = { name: 'My server' } as unknown as CreateServerDto;

    await expect(controller.create(req, dto)).resolves.toEqual({ id: 's1' });
    expect(serversService.create).toHaveBeenCalledWith('u1', dto);
  });

  it('removeMember delegates to service', async () => {
    serversService.removeMember.mockResolvedValue({ id: 's1' });
    const req = { user: { id: 'u1' } } as unknown as RequestWithUser;

    await expect(controller.removeMember(req, 's1', 'm1')).resolves.toEqual({
      id: 's1',
    });
    expect(serversService.removeMember).toHaveBeenCalledWith('s1', 'm1', 'u1');
  });
});
