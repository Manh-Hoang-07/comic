import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  // Storage type: 'local', 's3', or 'cloudinary'
  type: process.env.STORAGE_TYPE || 'local',

  // Max file size (bytes), default 10MB
  maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '10485760', 10),

  // Allowed file types (JSON string, optional - overrides defaults)
  // Example: '{"custom": {"extensions": [".custom"], "mimeTypes": ["application/custom"]}}'
  allowedFileTypes: process.env.STORAGE_ALLOWED_FILE_TYPES || undefined,

  // Local storage config
  local: {
    destination: process.env.VERCEL ? '/tmp/uploads' : './storage/uploads', // `/tmp` is the only writable directory on Vercel
    baseUrl: '/uploads', // Hardcoded - not sensitive
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // Remote object storage (S3/MinIO/compatible)
  s3: {
    // Tên biến chung, không gắn với provider cụ thể
    region: process.env.STORAGE_S3_REGION || 'us-east-1',
    bucket: process.env.STORAGE_S3_BUCKET || '',
    accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY || '',
    endpoint: process.env.STORAGE_S3_ENDPOINT || '',
    // Base URL trả về cho client (ví dụ: https://minio1.webtui.vn:9000/bucket-s3monmon)
    baseUrl: process.env.STORAGE_S3_BASE_URL || '',
    // MinIO thường yêu cầu path style. Mặc định true.
    forcePathStyle:
      (process.env.STORAGE_S3_FORCE_PATH_STYLE || 'true').toLowerCase() ===
      'true',
  },
}));
