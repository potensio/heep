import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl, { ssl: 'require', prepare: false, connect_timeout: 10 });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
