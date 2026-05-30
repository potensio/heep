import { beforeAll, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from '../db/client';

let migrated = false;

export async function migrateTestDb(): Promise<void> {
  if (migrated) return;
  await migrate(db, { migrationsFolder: 'src/core/db/migrations' });
  migrated = true;
}

// Wipe every public table between tests. Order-independent thanks to CASCADE.
export async function truncateAll(): Promise<void> {
  const rows = await sql<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'
  `;
  if (rows.length === 0) return;
  const list = rows.map((r) => `"${r.tablename}"`).join(', ');
  await sql.unsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

// Call at the top level of an integration test file to migrate once + reset per test.
export function useTestDb(): void {
  beforeAll(async () => { await migrateTestDb(); });
  beforeEach(async () => { await truncateAll(); });
}
