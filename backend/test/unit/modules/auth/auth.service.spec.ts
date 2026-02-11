jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../src/database/prisma.service';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { UsersService } from '../../../../src/modules/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  const usersService = {
    updateStatus: jest.fn(),
    findOne: jest.fn(),
  };
  const jwtService = { sign: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('validateUser returns null when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.validateUser('a@a.com', '123')).resolves.toBeNull();
  });

  it('login updates status and returns token', async () => {
    usersService.findOne.mockResolvedValue({ id: 'u1' });
    jwtService.sign.mockReturnValue('token');

    const result = await service.login({ id: 'u1', email: 'a', username: 'b' });

    expect(usersService.updateStatus).toHaveBeenCalledWith('u1', 'ONLINE');
    expect(result).toEqual({ user: { id: 'u1' }, accessToken: 'token' });
  });

  it('register throws conflict for existing email', async () => {
    prisma.user.findFirst.mockResolvedValue({ email: 'a@a.com', username: 'a' });

    await expect(
      service.register({ email: 'a@a.com', password: '123456', username: 'b' }),
    ).rejects.toThrow(ConflictException);
  });

  it('register creates user and returns token', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      username: 'alice',
      avatarUrl: null,
      status: 'ONLINE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtService.sign.mockReturnValue('token');

    const result = await service.register({
      email: 'a@a.com',
      password: '123456',
      username: 'alice',
    });

    expect(prisma.user.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('token');
  });
});
