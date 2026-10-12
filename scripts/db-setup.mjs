// Create the schema and load sample data: npm run db:setup
// Uses ADMIN_DATABASE_URL if set, otherwise DATABASE_URL (needs write access).
import { readFile } from "node:fs/promises";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Without .env.local, fall back to shell environment variables.
}

const connectionString = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL (or ADMIN_DATABASE_URL) is missing from .env.local.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

await client.connect();
await client.query("SET statement_timeout = 0");

for (const file of ["db/schema.sql", "db/seed.sql"]) {
  const started = performance.now();
  process.stdout.write(`Running ${file}... `);
  await client.query(await readFile(file, "utf8"));
  console.log(`${((performance.now() - started) / 1000).toFixed(1)}s`);
}

const { rows } = await client.query(`
  SELECT relname AS table, n_live_tup AS rows
  FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY relname
`);
console.table(rows);
await client.end();
