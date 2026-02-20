jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotFoundException, ConflictException } from '@nestjs/common';
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

  // --- findAll ---
  it('findAll returns users', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 'u1' }]);
  });

  // --- findOne ---
  it('findOne throws when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne('u1')).rejects.toThrow(NotFoundException);
  });

  it('findOne returns user', async () => {
    const user = { id: 'u1', username: 'alice' };
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(service.findOne('u1')).resolves.toEqual(user);
  });

  // --- findByUsername ---
  it('findByUsername returns empty array for blank input', async () => {
    await expect(service.findByUsername('   ')).resolves.toEqual([]);
  });

  it('findByUsername returns matching users', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1', username: 'alice' }]);
    await expect(service.findByUsername('ali')).resolves.toEqual([
      { id: 'u1', username: 'alice' },
    ]);
  });

  // --- update ---
  it('update throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.update('u1', { username: 'new' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update updates username only', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1', username: 'new' });

    const result = await service.update('u1', { username: 'new' });
    expect(prisma.user.update).toHaveBeenCalled();
    expect(result.username).toBe('new');
  });

  it('update throws ConflictException on duplicate username', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    const error = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    prisma.user.update.mockRejectedValue(error);

    await expect(service.update('u1', { username: 'taken' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('update uploads avatar and cleans up old one', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      avatarPublicId: 'old-id',
    });
    cloudinaryService.uploadImage.mockResolvedValue({
      secure_url: 'https://new.url/img.webp',
      public_id: 'new-id',
    });
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      avatarUrl: 'https://new.url/img.webp',
    });

    const file = { buffer: Buffer.from('test') } as Express.Multer.File;
    const result = await service.update('u1', {}, file);

    expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(file);
    expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('old-id');
    expect(result.avatarUrl).toBe('https://new.url/img.webp');
  });

  it('update with avatar skips old image cleanup when no previous avatar', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      avatarPublicId: null,
    });
    cloudinaryService.uploadImage.mockResolvedValue({
      secure_url: 'https://new.url/img.webp',
      public_id: 'new-id',
    });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    const file = { buffer: Buffer.from('test') } as Express.Multer.File;
    await service.update('u1', {}, file);

    expect(cloudinaryService.deleteImage).not.toHaveBeenCalled();
  });

  // --- updateStatus ---
  it('updateStatus updates status for existing user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1', status: 'ONLINE' });

    await expect(service.updateStatus('u1', 'ONLINE')).resolves.toEqual({
      id: 'u1',
      status: 'ONLINE',
    });
  });

  it('updateStatus throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.updateStatus('u1', 'ONLINE')).rejects.toThrow(
      NotFoundException,
    );
  });

  // --- findByEmail ---
  it('findByEmail returns user', async () => {
    const user = { id: 'u1', email: 'a@a.com' };
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(service.findByEmail('a@a.com')).resolves.toEqual(user);
  });
});
