jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../../../../src/database/cloudinary/cloudinary.service';
import { PrismaService } from '../../../../src/database/prisma.service';
import { UsersService } from '../../../../src/modules/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const cloudinaryService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('findByUsername returns empty array for blank input', async () => {
    await expect(service.findByUsername('   ')).resolves.toEqual([]);
  });

  it('findOne throws when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne('u1')).rejects.toThrow(NotFoundException);
  });

  it('updateStatus updates status for existing user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1', status: 'ONLINE' });

    await expect(service.updateStatus('u1', 'ONLINE')).resolves.toEqual({
      id: 'u1',
      status: 'ONLINE',
    });
  });
});
