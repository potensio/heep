import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env';
import { createR2Client } from './client';

export interface StorageService {
  presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]>;
  keyToPublicUrl(key: string): string;
}

export class FakeStorageService implements StorageService {
  async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
    return Array.from({ length: count }, (_, i) => ({
      key: `products/uploads/test-${i}.jpg`,
      uploadUrl: `https://fake-r2.test/upload/${i}`,
    }));
  }

  keyToPublicUrl(key: string): string {
    return `https://cdn.test.example.com/${key}`;
  }
}

export class R2StorageService implements StorageService {
  private client = createR2Client();

  async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
    return Promise.all(
      Array.from({ length: count }, async () => {
        const key = `products/uploads/${randomUUID()}.jpg`;
        const command = new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key });
        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
        return { key, uploadUrl };
      }),
    );
  }

  keyToPublicUrl(key: string): string {
    if (!env.R2_PUBLIC_URL) throw new Error('R2_PUBLIC_URL is not configured');
    return `${env.R2_PUBLIC_URL}/${key}`;
  }
}

function pickStorageService(): StorageService {
  if (env.NODE_ENV === 'test' || !env.R2_ACCOUNT_ID) return new FakeStorageService();
  return new R2StorageService();
}

export const storageService: StorageService = pickStorageService();
