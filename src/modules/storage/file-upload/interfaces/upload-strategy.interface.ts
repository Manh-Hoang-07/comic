export interface UploadResult {
  path: string;
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface IUploadStrategy {
  upload(file: any): Promise<UploadResult>;
}
