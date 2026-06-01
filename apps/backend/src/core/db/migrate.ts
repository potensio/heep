// src/core/db/migrate.ts
import { createDb } from './client';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be set');

const db = createDb(databaseUrl);
await migrate(db, { migrationsFolder: 'src/core/db/migrations' });
console.log('Migration complete');
