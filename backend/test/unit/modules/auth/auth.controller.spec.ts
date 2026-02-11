jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../../src/modules/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('register delegates to service', async () => {
    authService.register.mockResolvedValue({ id: 'u1' });
    const dto = { email: 'a@a.com', password: '123456', username: 'a' };
    await expect(controller.register(dto)).resolves.toEqual({ id: 'u1' });
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('login delegates to service', async () => {
    authService.login.mockResolvedValue({ accessToken: 't' });
    const req = { user: { id: 'u1', email: 'a', username: 'b' } } as any;
    await expect(controller.login(req)).resolves.toEqual({ accessToken: 't' });
    expect(authService.login).toHaveBeenCalledWith(req.user);
  });

  it('logout delegates to service', async () => {
    authService.logout.mockResolvedValue({ message: 'ok' });
    const req = { user: { id: 'u1' } } as any;
    await expect(controller.logout(req)).resolves.toEqual({ message: 'ok' });
    expect(authService.logout).toHaveBeenCalledWith('u1');
  });

  it('getProfile delegates to service', async () => {
    authService.getProfile.mockResolvedValue({ id: 'u1' });
    const req = { user: { id: 'u1' } } as any;
    await expect(controller.getProfile(req)).resolves.toEqual({ id: 'u1' });
    expect(authService.getProfile).toHaveBeenCalledWith('u1');
  });
});
