// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core/db/schema.ts',
  out: './src/core/db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
