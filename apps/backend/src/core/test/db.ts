import { beforeAll, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { sql } from 'drizzle-orm';
import { createDb } from '../db/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be set for tests');

export const testDb = createDb(databaseUrl);

let migrated = false;

export async function migrateTestDb(): Promise<void> {
  if (migrated) return;
  await migrate(testDb, { migrationsFolder: 'src/core/db/migrations' });
  migrated = true;
}

export async function truncateAll(): Promise<void> {
  const result = await testDb.execute<{ tablename: string }>(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'
  `);
  const rows = result.rows;
  if (rows.length === 0) return;
  const list = rows.map((r: any) => `"${r.tablename}"`).join(', ');
  await testDb.execute(sql.raw(`TRUNCATE ${list} RESTART IDENTITY CASCADE`));
}

// Call at the top level of an integration test file to migrate once + reset per test.
export function useTestDb(): void {
  beforeAll(async () => { await migrateTestDb(); });
  beforeEach(async () => { await truncateAll(); });
}
