"use client";

import { useState } from "react";
import { runQuery } from "@/lib/api";
import { formatDuration, formatNumber } from "@/lib/format";
import { useErrorText, useT } from "@/lib/i18n";
import type { QueryResponse } from "@/lib/types";
import { ResultTable } from "./ResultTable";

export const CONSOLE_INPUT_ID = "sql-console-input";

type Outcome =
  | { kind: "ok"; result: QueryResponse; roundTripMs: number }
  | { kind: "error"; error: unknown; roundTripMs: number };

export function SqlConsole({ sql, onSqlChange }: { sql: string; onSqlChange: (sql: string) => void }) {
  const t = useT();
  const errorText = useErrorText();
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [open, setOpen] = useState(false);

  const execute = async () => {
    if (running || !sql.trim()) return;
    setRunning(true);
    setOpen(true);
    const started = performance.now();
    try {
      const result = await runQuery(sql);
      setOutcome({ kind: "ok", result, roundTripMs: performance.now() - started });
    } catch (e) {
      setOutcome({ kind: "error", error: e, roundTripMs: performance.now() - started });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-panel/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        {outcome && open && (
          <div className="border-b border-line py-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              {outcome.kind === "ok" ? (
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span>
                    {t("console.executionTime")}{" "}
                    <b className="font-mono text-lg tabular-nums text-accent">
                      {(outcome.result.elapsedMs / 1000).toFixed(3)} s
                    </b>{" "}
                    <span className="font-mono text-xs text-muted">({formatDuration(outcome.result.elapsedMs)})</span>
                  </span>
                  <span className="text-muted">{t("console.rows", { count: formatNumber(outcome.result.rowCount) })}</span>
                  <span className="text-xs text-muted">
                    {t("console.roundTrip", { time: formatDuration(outcome.roundTripMs) })}
                  </span>
                </div>
              ) : (
                <span className="font-medium text-slow">{t("console.failed")}</span>
              )}
              <button onClick={() => setOpen(false)} className="text-xs text-muted hover:text-foreground">
                {t("console.close")}
              </button>
            </div>
            {outcome.kind === "ok" ? (
              <ResultTable result={outcome.result} className="max-h-[38vh]" />
            ) : (
              <pre className="rounded-md bg-slow/10 px-3 py-2 font-mono text-xs whitespace-pre-wrap text-slow">
                {errorText(outcome.error)}
              </pre>
            )}
          </div>
        )}

        <div className="flex items-stretch gap-2 py-3">
          <textarea
            id={CONSOLE_INPUT_ID}
            value={sql}
            onChange={(e) => onSqlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                execute();
              }
            }}
            rows={3}
            spellCheck={false}
            placeholder={t("console.placeholder")}
            className="min-w-0 flex-1 resize-y rounded-md border border-line bg-background px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={execute}
              disabled={running || !sql.trim()}
              className="flex-1 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {running ? t("console.running") : t("console.execute")}
            </button>
            {outcome && !open && (
              <button onClick={() => setOpen(true)} className="text-xs text-muted hover:text-foreground">
                {t("console.showResult")}
              </button>
            )}
          </div>
        </div>
        <p className="-mt-1.5 pb-2 text-[11px] text-muted">
          {t("console.hint")}
        </p>
      </div>
    </div>
  );
}
