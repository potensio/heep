// src/core/db/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './client';

async function main() {
  await migrate(db, { migrationsFolder: 'src/core/db/migrations' });
  await sql.end();
  console.log('Migrations applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
