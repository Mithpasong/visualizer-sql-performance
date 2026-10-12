"use client";

import { useEffect, useState } from "react";
import { fetchSchema } from "@/lib/api";
import { LOCALES, setLocale, useLocale, useT, type MessageKey } from "@/lib/i18n";
import type { TableInfo } from "@/lib/types";
import { ErdDiagram } from "./ErdDiagram";
import { ExampleList } from "./ExampleList";
import { CONSOLE_INPUT_ID, SqlConsole } from "./SqlConsole";
import { TableBrowser } from "./TableBrowser";

const SECTIONS: { id: string; label: MessageKey }[] = [
  { id: "tables", label: "nav.tables" },
  { id: "erd", label: "nav.erd" },
  { id: "examples", label: "nav.examples" },
];

export function SqlLab() {
  const t = useT();
  const locale = useLocale();
  const [tables, setTables] = useState<TableInfo[] | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [consoleSql, setConsoleSql] = useState("SELECT * FROM users ORDER BY id LIMIT 10;");

  useEffect(() => {
    fetchSchema()
      .then(({ tables }) => {
        setTables(tables);
        setSelected((prev) => prev ?? tables[0]?.name ?? null);
      })
      .catch((e: Error) => setSchemaError(e.message));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const selectFromErd = (name: string) => {
    setSelected(name);
    document.getElementById("tables")?.scrollIntoView({ behavior: "smooth" });
  };

  const openInConsole = (sql: string) => {
    setConsoleSql(sql);
    document.getElementById(CONSOLE_INPUT_ID)?.focus();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">SQL Performance Lab</h1>
            <p className="text-xs text-muted">{t("header.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 text-sm">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="rounded-md px-3 py-1.5 hover:bg-panel-strong">
                  {t(s.label)}
                </a>
              ))}
            </nav>
            <div className="flex rounded-md border border-line p-0.5 text-xs font-semibold" role="group" aria-label="Language">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  aria-pressed={l === locale}
                  className={`rounded px-2.5 py-1 transition-colors ${
                    l === locale ? "bg-accent text-white" : "text-muted hover:text-foreground"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 pt-6 pb-64">
        {schemaError && (
          <div className="rounded-lg border border-slow/40 bg-slow/10 p-4 text-sm">
            <p className="font-semibold text-slow">{t("schema.errorTitle")}</p>
            <p className="mt-1 font-mono text-xs">{schemaError}</p>
            <p className="mt-2 text-muted">{t("schema.errorHelp")}</p>
          </div>
        )}

        <Section id="tables" title={t("tables.title")} subtitle={t("tables.subtitle")}>
          {tables ? (
            <TableBrowser tables={tables} selected={selected} onSelect={setSelected} />
          ) : (
            !schemaError && <Loading />
          )}
        </Section>

        <Section id="erd" title={t("erd.title")} subtitle={t("erd.subtitle")}>
          {tables ? (
            <ErdDiagram tables={tables} selected={selected} onSelect={selectFromErd} />
          ) : (
            !schemaError && <Loading />
          )}
        </Section>

        <Section id="examples" title={t("examples.title")} subtitle={t("examples.subtitle")}>
          <ExampleList onOpenInConsole={openInConsole} />
        </Section>
      </main>

      <SqlConsole sql={consoleSql} onSqlChange={setConsoleSql} />
    </>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mb-4 text-sm text-muted">{subtitle}</p>
      {children}
    </section>
  );
}

function Loading() {
  return <div className="h-32 animate-pulse rounded-lg bg-panel-strong" />;
}
