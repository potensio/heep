import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

// One connection in tests (shared transactional state), pooled otherwise.
export const sql = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'test' ? 1 : 10,
});

export const db = drizzle(sql, { schema });

export type Database = typeof db;
