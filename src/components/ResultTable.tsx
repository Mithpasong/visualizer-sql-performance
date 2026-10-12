"use client";

import { formatCell, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { QueryResponse } from "@/lib/types";

export function ResultTable({
  result,
  className = "max-h-80",
}: {
  result: QueryResponse;
  className?: string;
}) {
  const t = useT();

  if (result.columns.length === 0) {
    return <p className="text-sm text-muted">{t("result.noColumns")}</p>;
  }

  return (
    <div className="space-y-1.5">
      <div className={`overflow-auto rounded-md border border-line ${className}`}>
        <table className="w-full border-collapse font-mono text-xs">
          <thead className="sticky top-0 bg-panel-strong">
            <tr>
              {result.columns.map((c) => (
                <th
                  key={c.name}
                  className="border-b border-line px-3 py-2 text-left font-semibold whitespace-nowrap"
                >
                  {c.name}
                  <span className="ml-1.5 font-normal text-muted">{c.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className="odd:bg-panel hover:bg-accent-soft">
                {result.columns.map((c) => {
                  const value = row[c.name];
                  return (
                    <td
                      key={c.name}
                      className={`max-w-xs truncate border-b border-line px-3 py-1.5 whitespace-nowrap ${
                        value === null ? "text-muted italic" : ""
                      }`}
                      title={formatCell(value)}
                    >
                      {formatCell(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.truncated && (
        <p className="text-xs text-muted">
          {t("result.truncated", {
            shown: formatNumber(result.rows.length),
            total: formatNumber(result.rowCount),
          })}
        </p>
      )}
    </div>
  );
}
