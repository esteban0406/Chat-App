jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../../../../src/modules/users/users.module', () => {
  const { Module } = require('@nestjs/common');
  @Module({})
  class UsersModule {}
  return { UsersModule };
});

import { Test } from '@nestjs/testing';
import { AuthModule } from '../../../../src/modules/auth/auth.module';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { JwtStrategy } from '../../../../src/modules/auth/strategies/jwt.strategy';
import { LocalStrategy } from '../../../../src/modules/auth/strategies/local.strategy';

describe('AuthModule', () => {
  it('compiles with mocked providers', async () => {
    const mod = await Test.createTestingModule({ imports: [AuthModule] })
      .overrideProvider(AuthService)
      .useValue({})
      .overrideProvider(LocalStrategy)
      .useValue({})
      .overrideProvider(JwtStrategy)
      .useValue({})
      .compile();

    expect(mod.get(AuthModule)).toBeDefined();
  });
});
