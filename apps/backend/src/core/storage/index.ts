// TODO(Task 6): env singleton removed; StorageService factory will receive ParsedEnv via injection.
// TODO(Task 6): createR2Client now requires ParsedEnv arg; R2StorageService needs to be refactored.
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

// TODO(Task 6): inject env; update createR2Client call and env.R2_* references below
export class R2StorageService implements StorageService {
  private client = createR2Client(null as any); // TODO(Task 6): pass real ParsedEnv

  async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
    return Promise.all(
      Array.from({ length: count }, async () => {
        const key = `products/uploads/${randomUUID()}.jpg`;
        const command = new PutObjectCommand({ Bucket: null as any, Key: key }); // TODO(Task 6): env.R2_BUCKET_NAME
        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
        return { key, uploadUrl };
      }),
    );
  }

  keyToPublicUrl(key: string): string {
    throw new Error('TODO(Task 6): R2_PUBLIC_URL must be injected via env'); // TODO(Task 6)
    return `${key}`;
  }
}

// TODO(Task 6): replace module-level singleton with a factory that accepts ParsedEnv
export const storageService: StorageService = new FakeStorageService();
