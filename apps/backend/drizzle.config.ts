import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.dev.vars' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core/db/schema.ts',
  out: './src/core/db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
