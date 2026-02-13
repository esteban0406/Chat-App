jest.mock('../../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../../../src/modules/auth/auth.service';
import { LocalStrategy } from '../../../../../src/modules/auth/strategies/local.strategy';

describe('LocalStrategy', () => {
  const authService = { validateUser: jest.fn() };
  let strategy: LocalStrategy;

  beforeEach(() => {
    strategy = new LocalStrategy(authService as unknown as AuthService);
    jest.clearAllMocks();
  });

  it('returns user when credentials are valid', async () => {
    const user = { id: 'u1', email: 'a@a.com' };
    authService.validateUser.mockResolvedValue(user);

    await expect(strategy.validate('a@a.com', 'pass')).resolves.toEqual(user);
    expect(authService.validateUser).toHaveBeenCalledWith('a@a.com', 'pass');
  });

  it('throws UnauthorizedException when credentials are invalid', async () => {
    authService.validateUser.mockResolvedValue(null);

    await expect(strategy.validate('a@a.com', 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
