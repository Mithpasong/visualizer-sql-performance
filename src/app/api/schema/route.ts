import { connection } from "next/server";
import { runReadOnly } from "@/lib/db";
import type { SchemaResponse, TableInfo } from "@/lib/types";

const COLUMNS_SQL = `
  SELECT c.table_name, c.column_name, c.data_type, c.is_nullable = 'YES' AS nullable
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position`;

const CONSTRAINTS_SQL = `
  SELECT con.contype AS kind, cl.relname AS table_name, att.attname AS column_name,
         rcl.relname AS ref_table, ratt.attname AS ref_column
  FROM pg_constraint con
  JOIN pg_class cl ON cl.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
  CROSS JOIN LATERAL unnest(con.conkey, coalesce(con.confkey, con.conkey)) AS k(attnum, refattnum)
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
  LEFT JOIN pg_class rcl ON rcl.oid = con.confrelid
  LEFT JOIN pg_attribute ratt ON ratt.attrelid = con.confrelid AND ratt.attnum = k.refattnum
  WHERE con.contype IN ('p', 'f')`;

const STATS_SQL = `
  SELECT c.relname AS table_name, greatest(c.reltuples, 0)::bigint AS row_estimate
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
  WHERE c.relkind IN ('r', 'p')`;

const INDEXES_SQL = `
  SELECT tablename AS table_name, indexname AS name, indexdef AS definition
  FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname`;

type Row = Record<string, string | boolean | null>;

export async function GET() {
  await connection();
  try {
    const [columns, constraints, stats, indexes] = await Promise.all(
      [COLUMNS_SQL, CONSTRAINTS_SQL, STATS_SQL, INDEXES_SQL].map((sql) => runReadOnly(sql, [], 10_000)),
    );

    const tables = new Map<string, TableInfo>();
    for (const r of columns.rows as Row[]) {
      const name = r.table_name as string;
      if (!tables.has(name)) tables.set(name, { name, rowEstimate: 0, columns: [], indexes: [] });
      tables.get(name)!.columns.push({
        name: r.column_name as string,
        type: r.data_type as string,
        nullable: r.nullable as boolean,
        isPrimaryKey: false,
        references: null,
      });
    }

    for (const r of constraints.rows as Row[]) {
      const column = tables.get(r.table_name as string)?.columns.find((c) => c.name === r.column_name);
      if (!column) continue;
      if (r.kind === "p") column.isPrimaryKey = true;
      else column.references = { table: r.ref_table as string, column: r.ref_column as string };
    }

    for (const r of stats.rows as Row[]) {
      const table = tables.get(r.table_name as string);
      if (table) table.rowEstimate = Number(r.row_estimate);
    }

    for (const r of indexes.rows as Row[]) {
      tables.get(r.table_name as string)?.indexes.push({
        name: r.name as string,
        definition: r.definition as string,
      });
    }

    const body: SchemaResponse = {
      tables: [...tables.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
    return Response.json(body);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
