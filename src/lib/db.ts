import { Pool, Query, type FieldDef, type QueryConfig, type QueryResult } from "pg";
import type { QueryResponse } from "./types";

const STATEMENT_TIMEOUT = "15s";
export const MAX_RETURN_ROWS = 500;

const globalForPg = globalThis as unknown as { pgPool?: Pool };

function getPool(): Pool {
  if (globalForPg.pgPool) return globalForPg.pgPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Check your .env.local file.");
  }

  // Keep few connections and release idle ones quickly: on serverless hosts every instance
  // has its own pool, and Supabase's session pooler only allows a small number of clients.
  globalForPg.pgPool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    max: process.env.VERCEL ? 1 : 3,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
  return globalForPg.pgPool;
}

const PG_TYPE_NAMES: Record<number, string> = {
  16: "bool", 20: "int8", 21: "int2", 23: "int4", 25: "text", 700: "float4", 701: "float8",
  1043: "varchar", 1082: "date", 1114: "timestamp", 1184: "timestamptz", 1700: "numeric",
  114: "json", 3802: "jsonb", 2950: "uuid",
};

/**
 * Runs a query inside a READ ONLY transaction and measures how long the query itself took.
 * All rows are fetched (so the timing is real), but only the first maxRows are returned.
 */
export async function runReadOnly(
  sql: string,
  values: unknown[] = [],
  maxRows = MAX_RETURN_ROWS,
): Promise<QueryResponse> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query(`SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT}'`);

    const rows: Record<string, unknown>[] = [];
    let totalRows = 0;
    // The extended protocol rejects multiple statements in a single query.
    const query = new Query({ text: sql, values, queryMode: "extended" } as QueryConfig);

    const started = performance.now();
    const result = await new Promise<QueryResult>((resolve, reject) => {
      query.on("row", (row: Record<string, unknown>) => {
        totalRows++;
        if (rows.length < maxRows) rows.push(row);
      });
      query.on("end", resolve);
      query.on("error", reject);
      client.query(query);
    });
    const elapsedMs = performance.now() - started;

    return {
      columns: (result.fields ?? []).map((f: FieldDef) => ({
        name: f.name,
        type: PG_TYPE_NAMES[f.dataTypeID] ?? String(f.dataTypeID),
      })),
      rows,
      rowCount: result.fields?.length ? totalRows : (result.rowCount ?? 0),
      truncated: totalRows > rows.length,
      elapsedMs,
    };
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
  }
}
