import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be set');

const client = postgres(databaseUrl, { ssl: 'require', max: 1 });
const db = drizzle(client);
await migrate(db, { migrationsFolder: 'src/core/db/migrations' });
console.log('Migration complete');
await client.end();
