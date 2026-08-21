import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

export async function applyPostgresMigrations(
  databaseUrl: string,
  migrationsDirectory: string,
): Promise<void> {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });

  try {
    await migrate(drizzle(pool), { migrationsFolder: migrationsDirectory });
  } finally {
    await pool.end();
  }
}

export function quotePostgresIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
