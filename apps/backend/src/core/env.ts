import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(2592000),
  OTP_TTL: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('BantuJual <noreply@bantujual.app>'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

export type ParsedEnv = z.infer<typeof EnvSchema>;

export function parseEnv(raw: Record<string, unknown>): ParsedEnv {
  return EnvSchema.parse(raw);
}
