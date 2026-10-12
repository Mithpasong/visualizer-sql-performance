import { ApiError } from "./i18n";
import type { ApiErrorBody, ExplainResponse, QueryResponse, SchemaResponse } from "./types";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok || "error" in body) {
    const { error, code, params } = body as ApiErrorBody;
    throw new ApiError(error ?? `HTTP ${res.status}`, code, params);
  }
  return body as T;
}

export function fetchSchema() {
  return request<SchemaResponse>("/api/schema");
}

export function fetchTableRows(name: string, page: number, pageSize: number) {
  return request<QueryResponse>(
    `/api/tables/${encodeURIComponent(name)}?page=${page}&pageSize=${pageSize}`,
  );
}

function post<T>(body: object) {
  return request<T>("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function runQuery(sql: string) {
  return post<QueryResponse>({ sql });
}

export function explainQuery(sql: string) {
  return post<ExplainResponse>({ sql, explain: true });
}
