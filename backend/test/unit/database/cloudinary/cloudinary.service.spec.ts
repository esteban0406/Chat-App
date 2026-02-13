jest.mock('cloudinary', () => {
  const mockEnd = jest.fn();
  const mockUploadStream = jest.fn(() => ({ end: mockEnd }));
  const mockDestroy = jest.fn();
  return {
    v2: {
      uploader: {
        upload_stream: mockUploadStream,
        destroy: mockDestroy,
      },
    },
    __mockUploadStream: mockUploadStream,
    __mockEnd: mockEnd,
    __mockDestroy: mockDestroy,
  };
});

import { CloudinaryService } from '../../../../src/database/cloudinary/cloudinary.service';

const cloudinaryMock = jest.requireMock<{
  __mockUploadStream: jest.Mock;
  __mockDestroy: jest.Mock;
}>('cloudinary');
const mockUploadStream = cloudinaryMock.__mockUploadStream;
const mockDestroy = cloudinaryMock.__mockDestroy;

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    service = new CloudinaryService();
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    const file = { buffer: Buffer.from('test') } as Express.Multer.File;

    it('resolves with result on success', async () => {
      const result = {
        secure_url: 'https://example.com/img.webp',
        public_id: 'avatars/abc',
      };
      mockUploadStream.mockImplementation(
        (_opts: unknown, cb: (err: unknown, res: unknown) => void) => {
          cb(null, result);
          return { end: jest.fn() };
        },
      );

      await expect(service.uploadImage(file)).resolves.toEqual(result);
    });

    it('rejects when cloudinary returns error', async () => {
      mockUploadStream.mockImplementation(
        (_opts: unknown, cb: (err: unknown, res: unknown) => void) => {
          cb({ message: 'upload failed' }, null);
          return { end: jest.fn() };
        },
      );

      await expect(service.uploadImage(file)).rejects.toThrow('upload failed');
    });

    it('rejects when result is null', async () => {
      mockUploadStream.mockImplementation(
        (_opts: unknown, cb: (err: unknown, res: unknown) => void) => {
          cb(null, null);
          return { end: jest.fn() };
        },
      );

      await expect(service.uploadImage(file)).rejects.toThrow(
        'Upload returned no result',
      );
    });
  });

  describe('deleteImage', () => {
    it('completes without throwing on success', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });
      await expect(service.deleteImage('avatars/abc')).resolves.toBeUndefined();
    });

    it('logs warning when result is not ok', async () => {
      const warnSpy = jest
        .spyOn(
          (service as unknown as { logger: { warn: jest.Mock } }).logger,
          'warn',
        )
        .mockImplementation(() => {});
      mockDestroy.mockResolvedValue({ result: 'not found' });

      await service.deleteImage('avatars/abc');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('not found'),
      );
    });

    it('catches and logs errors without throwing', async () => {
      const errorSpy = jest
        .spyOn(
          (service as unknown as { logger: { error: jest.Mock } }).logger,
          'error',
        )
        .mockImplementation(() => {});
      mockDestroy.mockRejectedValue(new Error('network error'));

      await expect(service.deleteImage('avatars/abc')).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
