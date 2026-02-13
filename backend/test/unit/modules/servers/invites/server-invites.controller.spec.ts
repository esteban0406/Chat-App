jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

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

import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../../../src/modules/auth/types';
import { ChatGateway } from '../../../../../src/modules/gateway/chat.gateway';
import { ServerInvitesController } from '../../../../../src/modules/servers/invites/server-invites.controller';
import { SendServerInviteDto } from '../../../../../src/modules/servers/invites/dto/send-invite.dto';
import { ServerInvitesService } from '../../../../../src/modules/servers/invites/server-invites.service';

describe('ServerInvitesController', () => {
  let controller: ServerInvitesController;
  const service = {
    getPendingInvites: jest.fn(),
    getSentInvites: jest.fn(),
    sendInvite: jest.fn(),
    acceptInvite: jest.fn(),
    rejectInvite: jest.fn(),
    cancelInvite: jest.fn(),
  };
  const chatGateway = { emitToUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerInvitesController],
      providers: [
        { provide: ServerInvitesService, useValue: service },
        { provide: ChatGateway, useValue: chatGateway },
      ],
    }).compile();

    controller = module.get(ServerInvitesController);
    jest.clearAllMocks();
  });

  it('sendInvite delegates to service and emits event', async () => {
    service.sendInvite.mockResolvedValue({ id: 'i1' });
    const req = { user: { id: 'u1' } } as unknown as RequestWithUser;

    await expect(
      controller.sendInvite(req, 's1', {
        receiverId: 'u2',
      } as unknown as SendServerInviteDto),
    ).resolves.toEqual({ id: 'i1' });

    expect(service.sendInvite).toHaveBeenCalledWith('u1', 'u2', 's1');
    expect(chatGateway.emitToUser).toHaveBeenCalled();
  });
});
