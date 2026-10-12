"use client";

import { useState } from "react";
import { explainQuery, runQuery } from "@/lib/api";
import { EXAMPLES, type ExampleScenario, type ExampleVariant } from "@/lib/examples";
import { formatDuration, formatNumber } from "@/lib/format";
import { useErrorText, useLocale, useT } from "@/lib/i18n";
import type { ExplainResponse, QueryResponse } from "@/lib/types";
import { ResultTable } from "./ResultTable";
import { TimeBadge } from "./TableBrowser";

type VariantState = {
  running: boolean;
  result?: QueryResponse;
  explain?: ExplainResponse;
  error?: unknown;
  view: "rows" | "plan" | null;
};

const INITIAL: VariantState = { running: false, view: null };
const LETTERS = ["A", "B"] as const;

export function ExampleList({ onOpenInConsole }: { onOpenInConsole: (sql: string) => void }) {
  const t = useT();
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{t("examples.intro")}</p>
      {EXAMPLES.map((scenario, i) => (
        <Scenario key={scenario.id} index={i + 1} scenario={scenario} onOpenInConsole={onOpenInConsole} />
      ))}
    </div>
  );
}

function Scenario({
  index,
  scenario,
  onOpenInConsole,
}: {
  index: number;
  scenario: ExampleScenario;
  onOpenInConsole: (sql: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [states, setStates] = useState<[VariantState, VariantState]>([INITIAL, INITIAL]);

  const update = (i: number, patch: Partial<VariantState>) =>
    setStates((prev) => {
      const next = [...prev] as [VariantState, VariantState];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  const run = async (i: number) => {
    update(i, { running: true, error: undefined });
    try {
      const result = await runQuery(scenario.variants[i].sql);
      update(i, { running: false, result, view: "rows" });
    } catch (e) {
      update(i, { running: false, error: e });
    }
  };

  const explain = async (i: number) => {
    update(i, { running: true, error: undefined });
    try {
      const explain = await explainQuery(scenario.variants[i].sql);
      update(i, { running: false, explain, view: "plan" });
    } catch (e) {
      update(i, { running: false, error: e });
    }
  };

  const runBoth = async () => {
    await run(0);
    await run(1);
  };

  const [a, b] = states;
  const anyRunning = a.running || b.running;

  return (
    <article className="rounded-xl border border-line bg-panel p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h3 className="font-semibold">
            <span className="mr-2 text-muted">{index}.</span>
            {scenario.title[locale]}
          </h3>
          <p className="mt-1 text-sm text-muted">{scenario.description[locale]}</p>
        </div>
        <button
          onClick={runBoth}
          disabled={anyRunning}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t("examples.runBoth")}
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {scenario.variants.map((variant, i) => (
          <VariantCard
            key={i}
            letter={LETTERS[i]}
            variant={variant}
            state={states[i]}
            tone={toneFor(states, i)}
            onRun={() => run(i)}
            onExplain={() => explain(i)}
            onView={(view) => update(i, { view: states[i].view === view ? null : view })}
            onOpenInConsole={() => onOpenInConsole(variant.sql)}
          />
        ))}
      </div>

      {a.result && b.result && <Comparison a={a.result.elapsedMs} b={b.result.elapsedMs} />}
    </article>
  );
}

function toneFor(states: [VariantState, VariantState], i: number): "neutral" | "fast" | "slow" {
  const [a, b] = states.map((s) => s.result?.elapsedMs);
  if (a === undefined || b === undefined) return "neutral";
  const mine = i === 0 ? a : b;
  const other = i === 0 ? b : a;
  return mine <= other ? "fast" : "slow";
}

function VariantCard({
  letter,
  variant,
  state,
  tone,
  onRun,
  onExplain,
  onView,
  onOpenInConsole,
}: {
  letter: string;
  variant: ExampleVariant;
  state: VariantState;
  tone: "neutral" | "fast" | "slow";
  onRun: () => void;
  onExplain: () => void;
  onView: (view: "rows" | "plan") => void;
  onOpenInConsole: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const errorText = useErrorText();

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-panel-strong text-xs font-bold">
            {letter}
          </span>
          {variant.label[locale]}
        </div>
        <div className="flex items-center gap-2">
          {state.running && <span className="text-xs text-muted">{t("examples.running")}</span>}
          {!state.running && state.result && <TimeBadge ms={state.result.elapsedMs} tone={tone} />}
        </div>
      </div>

      <pre className="overflow-x-auto rounded-md bg-panel-strong p-3 font-mono text-xs leading-relaxed">
        {variant.sql}
      </pre>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <button
          onClick={onRun}
          disabled={state.running}
          className="rounded-md border border-accent px-2.5 py-1 font-medium text-accent hover:bg-accent-soft disabled:opacity-50"
        >
          {t("examples.run")}
        </button>
        <button
          onClick={onExplain}
          disabled={state.running}
          className="rounded-md border border-line px-2.5 py-1 hover:bg-panel-strong disabled:opacity-50"
        >
          {t("examples.explain")}
        </button>
        <button
          onClick={onOpenInConsole}
          className="rounded-md border border-line px-2.5 py-1 hover:bg-panel-strong"
        >
          {t("examples.editInConsole")}
        </button>
        {state.result && (
          <button onClick={() => onView("rows")} className="ml-auto text-muted underline-offset-2 hover:underline">
            {state.view === "rows"
              ? t("examples.hideRows")
              : t("examples.showRows", { count: formatNumber(state.result.rowCount) })}
          </button>
        )}
        {state.explain && (
          <button
            onClick={() => onView("plan")}
            className={`${state.result ? "" : "ml-auto"} text-muted underline-offset-2 hover:underline`}
          >
            {state.view === "plan" ? t("examples.hidePlan") : t("examples.showPlan")}
          </button>
        )}
      </div>

      {state.error !== undefined && (
        <p className="rounded-md bg-slow/10 px-3 py-2 text-xs text-slow">{errorText(state.error)}</p>
      )}

      {state.view === "rows" && state.result && <ResultTable result={state.result} className="max-h-64" />}

      {state.view === "plan" && state.explain && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-3 text-xs">
            {state.explain.executionMs !== null && (
              <span>
                {t("examples.dbExecution")}{" "}
                <b className="font-mono">{formatDuration(state.explain.executionMs)}</b>
              </span>
            )}
            {state.explain.planningMs !== null && (
              <span className="text-muted">
                {t("examples.planning")}{" "}
                <span className="font-mono">{formatDuration(state.explain.planningMs)}</span>
              </span>
            )}
          </div>
          <pre className="max-h-72 overflow-auto rounded-md border border-line p-3 font-mono text-[11px] leading-relaxed">
            {state.explain.plan}
          </pre>
        </div>
      )}
    </div>
  );
}

function Comparison({ a, b }: { a: number; b: number }) {
  const t = useT();
  const max = Math.max(a, b);
  const fasterIsB = b < a;
  const ratio = fasterIsB ? a / b : b / a;

  return (
    <div className="mt-4 space-y-2 rounded-lg bg-panel-strong p-3">
      {[a, b].map((ms, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-4 font-bold">{LETTERS[i]}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full ${ms === max && a !== b ? "bg-slow" : "bg-fast"}`}
              style={{ width: `${Math.max((ms / max) * 100, 1)}%` }}
            />
          </div>
          <span className="w-20 text-right font-mono tabular-nums">{formatDuration(ms)}</span>
        </div>
      ))}
      <p className="text-sm font-semibold text-fast">
        {t("examples.faster", { who: fasterIsB ? "B" : "A", ratio: ratio.toFixed(1) })}
      </p>
    </div>
  );
}
