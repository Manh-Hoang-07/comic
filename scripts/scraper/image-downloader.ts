import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const REFERER = 'https://nettruyen.works/';

const REQUEST_HEADERS = {
  Referer: REFERER,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/**
 * Download image to a Buffer (for upload to S3/Cloudinary/etc.)
 */
export function downloadToBuffer(imageUrl: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const url = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;
    const client = url.startsWith('https') ? https : http;

    const request = client.get(
      url,
      { headers: REQUEST_HEADERS, timeout: 30000 },
      (response) => {
        // Follow redirects
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          downloadToBuffer(response.headers.location).then(resolve);
          return;
        }

        if (response.statusCode !== 200) {
          console.warn(`    [Download] HTTP ${response.statusCode} for ${url}`);
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', (err) => {
          console.warn(`    [Download] Stream error: ${err.message}`);
          resolve(null);
        });
      },
    );

    request.on('error', (err) => {
      console.warn(`    [Download] Request error: ${err.message}`);
      resolve(null);
    });

    request.on('timeout', () => {
      request.destroy();
      console.warn(`    [Download] Timeout for ${url}`);
      resolve(null);
    });
  });
}

/**
 * Download image to a local file path (legacy, used for local storage)
 */
export async function downloadImage(imageUrl: string, savePath: string): Promise<boolean> {
  // Skip if already downloaded
  if (fs.existsSync(savePath)) {
    return true;
  }

  // Ensure directory exists
  const dir = path.dirname(savePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve) => {
    const url = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;
    const client = url.startsWith('https') ? https : http;

    const request = client.get(
      url,
      { headers: REQUEST_HEADERS, timeout: 30000 },
      (response) => {
        // Follow redirects
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          downloadImage(response.headers.location, savePath).then(resolve);
          return;
        }

        if (response.statusCode !== 200) {
          console.warn(`    [Download] HTTP ${response.statusCode} for ${url}`);
          resolve(false);
          return;
        }

        const fileStream = fs.createWriteStream(savePath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });

        fileStream.on('error', (err) => {
          fs.unlink(savePath, () => {});
          console.warn(`    [Download] Write error: ${err.message}`);
          resolve(false);
        });
      },
    );

    request.on('error', (err) => {
      console.warn(`    [Download] Request error: ${err.message}`);
      resolve(false);
    });

    request.on('timeout', () => {
      request.destroy();
      console.warn(`    [Download] Timeout for ${url}`);
      resolve(false);
    });
  });
}

export async function downloadWithRetry(imageUrl: string, savePath: string, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const success = await downloadImage(imageUrl, savePath);
    if (success) return true;

    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`    [Download] Retry ${attempt}/${maxRetries} in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return false;
}

export async function downloadToBufferWithRetry(imageUrl: string, maxRetries = 3): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const buffer = await downloadToBuffer(imageUrl);
    if (buffer) return buffer;

    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`    [Download] Retry ${attempt}/${maxRetries} in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return null;
}
