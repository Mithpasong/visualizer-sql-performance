export type ColumnInfo = {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  references: { table: string; column: string } | null;
};

export type TableInfo = {
  name: string;
  rowEstimate: number;
  columns: ColumnInfo[];
  indexes: { name: string; definition: string }[];
};

export type SchemaResponse = { tables: TableInfo[] };

export type QueryResponse = {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
  /** Total number of rows the query actually returned */
  rowCount: number;
  /** Whether rows was cut short of rowCount */
  truncated: boolean;
  /** Query execution + result transfer time, measured on the server */
  elapsedMs: number;
};

export type ExplainResponse = {
  plan: string;
  planningMs: number | null;
  executionMs: number | null;
  elapsedMs: number;
};

export type ApiErrorBody = { error: string; code?: string; params?: Record<string, string> };
