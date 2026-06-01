// TODO(Task 6): env singleton removed; accept ParsedEnv as a parameter instead.
import { S3Client } from '@aws-sdk/client-s3';
import type { ParsedEnv } from '../env';

export function createR2Client(env: ParsedEnv): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}
