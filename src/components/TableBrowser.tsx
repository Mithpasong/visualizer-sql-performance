"use client";

import { useEffect, useState } from "react";
import { fetchTableRows } from "@/lib/api";
import { formatDuration, formatNumber } from "@/lib/format";
import { useErrorText, useT } from "@/lib/i18n";
import type { QueryResponse, TableInfo } from "@/lib/types";
import { ResultTable } from "./ResultTable";

const PAGE_SIZE = 50;

export function TableBrowser({
  tables,
  selected,
  onSelect,
}: {
  tables: TableInfo[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const t = useT();
  const table = tables.find((tb) => tb.name === selected) ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {tables.map((tb) => (
          <li key={tb.name}>
            <button
              onClick={() => onSelect(tb.name)}
              className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm whitespace-nowrap transition-colors ${
                tb.name === selected
                  ? "bg-accent text-white"
                  : "hover:bg-panel-strong"
              }`}
            >
              <span className="font-mono font-medium">{tb.name}</span>
              <span className={`text-xs ${tb.name === selected ? "text-white/80" : "text-muted"}`}>
                ~{formatNumber(tb.rowEstimate)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {table ? (
        <div className="min-w-0 space-y-4">
          <TableStructure table={table} />
          <TableData key={table.name} name={table.name} rowEstimate={table.rowEstimate} />
        </div>
      ) : (
        <p className="self-center text-sm text-muted">{t("tables.selectPrompt")}</p>
      )}
    </div>
  );
}

function TableStructure({ table }: { table: TableInfo }) {
  const t = useT();
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="overflow-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead className="bg-panel-strong text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2">{t("tables.column")}</th>
              <th className="px-3 py-2">{t("tables.type")}</th>
              <th className="px-3 py-2">{t("tables.keyRelation")}</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((c) => (
              <tr key={c.name} className="border-t border-line">
                <td className="px-3 py-1.5 font-mono">
                  {c.name}
                  {!c.nullable && <span className="ml-1 text-xs text-muted">NOT NULL</span>}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-muted">{c.type}</td>
                <td className="px-3 py-1.5 text-xs">
                  {c.isPrimaryKey && (
                    <span className="mr-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-400">
                      PK
                    </span>
                  )}
                  {c.references && (
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-accent">
                      FK → {c.references.table}.{c.references.column}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-line p-3">
        <h4 className="mb-2 text-xs font-semibold text-muted">{t("tables.indexes", { count: table.indexes.length })}</h4>
        <ul className="space-y-2">
          {table.indexes.map((idx) => (
            <li key={idx.name} className="text-xs">
              <div className="font-mono font-medium">{idx.name}</div>
              <div className="font-mono break-all text-muted">{idx.definition}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TableData({ name, rowEstimate }: { name: string; rowEstimate: number }) {
  const t = useT();
  const errorText = useErrorText();
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTableRows(name, page, PAGE_SIZE)
      .then((r) => !cancelled && (setResult(r), setError(null)))
      .catch((e: unknown) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [name, page]);

  const goTo = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-muted">SELECT * FROM {name} ORDER BY 1 LIMIT {PAGE_SIZE} OFFSET {page * PAGE_SIZE}</span>
          {result && !loading && <TimeBadge ms={result.elapsedMs} />}
          {loading && <span className="text-xs text-muted">{t("tables.loading")}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 0 || loading}
            className="rounded-md border border-line px-2.5 py-1 hover:bg-panel-strong disabled:opacity-40"
          >
            {t("tables.prev")}
          </button>
          <span className="px-2 text-xs text-muted">
            {t("tables.page", {
              page: page + 1,
              total: formatNumber(Math.max(Math.ceil(rowEstimate / PAGE_SIZE), 1)),
            })}
          </span>
          <button
            onClick={() => goTo(page + 1)}
            disabled={loading || (result?.rowCount ?? 0) < PAGE_SIZE}
            className="rounded-md border border-line px-2.5 py-1 hover:bg-panel-strong disabled:opacity-40"
          >
            {t("tables.next")}
          </button>
        </div>
      </div>
      {error !== null && (
        <p className="rounded-md bg-slow/10 px-3 py-2 text-sm text-slow">{errorText(error)}</p>
      )}
      {result && <ResultTable result={result} className="max-h-[420px]" />}
    </div>
  );
}

export function TimeBadge({ ms, tone = "neutral" }: { ms: number; tone?: "neutral" | "fast" | "slow" }) {
  const toneClass =
    tone === "fast" ? "bg-fast/15 text-fast" : tone === "slow" ? "bg-slow/15 text-slow" : "bg-accent-soft text-accent";
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${toneClass}`}>
      {formatDuration(ms)}
    </span>
  );
}
