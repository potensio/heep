import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client } from '@aws-sdk/client-s3';

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

export interface R2Config {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
}

export class R2StorageService implements StorageService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(config: R2Config) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = config.R2_BUCKET_NAME;
    this.publicUrl = config.R2_PUBLIC_URL;
  }

  async presignUpload(count: number): Promise<{ uploadUrl: string; key: string }[]> {
    return Promise.all(
      Array.from({ length: count }, async () => {
        const key = `products/uploads/${randomUUID()}.jpg`;
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
        return { key, uploadUrl };
      }),
    );
  }

  keyToPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
