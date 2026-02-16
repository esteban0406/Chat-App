jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock(
  '../../../../src/modules/users/friendships/friendships.module',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const { Module } = require('@nestjs/common');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    @Module({})
    class FriendshipsModule {}
    return { FriendshipsModule };
  },
);

jest.mock('../../../../src/database/cloudinary/cloudinary.module', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const { Module } = require('@nestjs/common');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Module({})
  class CloudinaryModule {}
  return { CloudinaryModule };
});

import { Test } from '@nestjs/testing';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { UsersService } from '../../../../src/modules/users/users.service';

describe('UsersModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();

    expect(mod.get(UsersModule)).toBeDefined();
  });
});
