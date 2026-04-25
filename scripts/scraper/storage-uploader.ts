import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

type StorageType = 'local' | 's3' | 'cloudinary';

export interface UploadResult {
  url: string;
}

interface StorageUploader {
  upload(buffer: Buffer, key: string, mimetype: string): Promise<UploadResult>;
}

// ─── Local Storage ────────────────────────────────────────────────────────────

class LocalUploader implements StorageUploader {
  private readonly basePath: string;

  constructor() {
    this.basePath = path.resolve(__dirname, '../../storage/comics');
  }

  async upload(buffer: Buffer, key: string): Promise<UploadResult> {
    const filePath = path.join(this.basePath, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return { url: `/storage/comics/${key}` };
  }
}

// ─── S3 Storage ───────────────────────────────────────────────────────────────

class S3Uploader implements StorageUploader {
  private s3Client: any;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor() {
    const endpoint = (process.env.STORAGE_S3_ENDPOINT || '').replace(/\/$/, '');
    this.bucket = process.env.STORAGE_S3_BUCKET || '';
    this.baseUrl = (process.env.STORAGE_S3_BASE_URL || '').replace(/\/$/, '');
    const forcePathStyle = (process.env.STORAGE_S3_FORCE_PATH_STYLE || 'true').toLowerCase() === 'true';

    // Lazy import to avoid requiring @aws-sdk/client-s3 when not using S3
    const { S3Client } = require('@aws-sdk/client-s3');
    this.s3Client = new S3Client({
      region: process.env.STORAGE_S3_REGION || 'us-east-1',
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle,
    });
  }

  async upload(buffer: Buffer, key: string, mimetype: string): Promise<UploadResult> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: `comics/${key}`,
      Body: buffer,
      ContentType: mimetype,
    });
    await this.s3Client.send(command);
    return { url: `${this.baseUrl}/comics/${key}` };
  }
}

// ─── Cloudinary Storage ───────────────────────────────────────────────────────

class CloudinaryUploader implements StorageUploader {
  private cloudinary: any;

  constructor() {
    this.cloudinary = require('cloudinary').v2;
    this.cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET || '',
    });
  }

  async upload(buffer: Buffer, key: string): Promise<UploadResult> {
    // Remove extension for public_id
    const ext = path.extname(key);
    const publicId = `comics/${key.replace(ext, '')}`;

    const result = await new Promise<any>((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          format: ext.replace('.', '') || undefined,
          overwrite: false,
        },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      stream.end(buffer);
    });

    return { url: result.secure_url };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _uploader: StorageUploader | null = null;

export function getStorageType(): StorageType {
  return (process.env.STORAGE_TYPE as StorageType) || 'local';
}

export function getUploader(): StorageUploader {
  if (_uploader) return _uploader;

  const type = getStorageType();
  switch (type) {
    case 's3':
      _uploader = new S3Uploader();
      break;
    case 'cloudinary':
      _uploader = new CloudinaryUploader();
      break;
    case 'local':
    default:
      _uploader = new LocalUploader();
      break;
  }

  console.log(`[Storage] Using ${type} storage`);
  return _uploader;
}
