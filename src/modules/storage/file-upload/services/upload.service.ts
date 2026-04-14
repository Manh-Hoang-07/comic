import { Injectable, Inject } from '@nestjs/common';
import {
  IUploadStrategy,
  UploadResult,
} from '../interfaces/upload-strategy.interface';

@Injectable()
export class UploadService {
  constructor(
    @Inject('UPLOAD_STRATEGY') private readonly strategy: IUploadStrategy,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) {
      throw new Error('File is required');
    }

    return this.strategy.upload(file);
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new Error('Files are required');
    }

    return Promise.all(files.map((file) => this.strategy.upload(file)));
  }
}
