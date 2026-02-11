jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../../src/modules/users/users.controller';
import { UsersService } from '../../../../src/modules/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findAll: jest.fn(),
    findByUsername: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get(UsersController);
    jest.clearAllMocks();
  });

  it('search delegates to service', async () => {
    usersService.findByUsername.mockResolvedValue([{ id: 'u1' }]);
    await expect(controller.search({ username: 'ali' } as any)).resolves.toEqual([
      { id: 'u1' },
    ]);
    expect(usersService.findByUsername).toHaveBeenCalledWith('ali');
  });

  it('getMe delegates to service', async () => {
    usersService.findOne.mockResolvedValue({ id: 'u1' });
    const req = { user: { id: 'u1' } } as any;

    await expect(controller.getMe(req)).resolves.toEqual({ id: 'u1' });
    expect(usersService.findOne).toHaveBeenCalledWith('u1');
  });
});
