import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as path from 'path';
import {
  IUploadStrategy,
  UploadResult,
} from '../interfaces/upload-strategy.interface';

@Injectable()
export class CloudinaryStorageStrategy implements IUploadStrategy {
  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get('storage.cloudinary');

    cloudinary.config({
      cloud_name: config?.cloudName,
      api_key: config?.apiKey,
      api_secret: config?.apiSecret,
    });
  }

  async upload(file: any): Promise<UploadResult> {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const publicId = `${timestamp}-${randomString}`;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          format: ext.replace('.', '') || undefined,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );

      stream.end(file.buffer);
    }).catch((error) => {
      throw new BadRequestException(
        `Cloudinary upload failed: ${error.message}`,
      );
    });

    return {
      path: result.public_id,
      url: result.secure_url,
      filename: `${publicId}${ext}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
