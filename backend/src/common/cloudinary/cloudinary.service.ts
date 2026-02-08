import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'avatars',
            transformation: [
              { width: 256, height: 256, crop: 'fill', gravity: 'face' },
            ],
            format: 'webp',
            quality: 'auto',
          },
          (error, result) => {
            if (error)
              return reject(
                new Error(error.message ?? 'Cloudinary upload failed'),
              );
            if (!result) return reject(new Error('Upload returned no result'));
            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId)) as {
        result: string;
      };
      if (result.result !== 'ok') {
        this.logger.warn(
          `Cloudinary delete for "${publicId}" returned: ${result.result}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete image "${publicId}" from Cloudinary`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
