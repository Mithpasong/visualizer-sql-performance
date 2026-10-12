import { useCallback, useSyncExternalStore } from "react";

export type Locale = "en" | "ko";
export const LOCALES: Locale[] = ["en", "ko"];

const en = {
  "header.subtitle": "See how the way you write a query changes its performance",
  "nav.tables": "Tables",
  "nav.erd": "ERD",
  "nav.examples": "Examples",

  "schema.errorTitle": "Could not connect to the database.",
  "schema.errorHelp": "Check DATABASE_URL in .env.local, and make sure you loaded the sample data with npm run db:setup.",

  "tables.title": "Tables",
  "tables.subtitle": "Select a table to see its columns, indexes and data.",
  "tables.selectPrompt": "Select a table on the left.",
  "tables.column": "Column",
  "tables.type": "Type",
  "tables.keyRelation": "Key / Relation",
  "tables.indexes": "Indexes ({count})",
  "tables.loading": "Loading…",
  "tables.prev": "Prev",
  "tables.next": "Next",
  "tables.page": "Page {page} of ~{total}",

  "erd.title": "ERD",
  "erd.subtitle": "Foreign key relationships between tables. Click a table to view its data above.",

  "examples.title": "Examples · Performance comparison",
  "examples.subtitle": "Compare the execution time of two queries (A and B) that answer the same question.",
  "examples.intro":
    "Times are measured on the Next.js server and cover query execution + receiving the result (including the network round trip). To see only the time spent inside the database, click Explain (EXPLAIN ANALYZE). The first run can be slower because caches are cold, so run each query a few times before comparing.",
  "examples.runBoth": "Run A and B",
  "examples.running": "Running…",
  "examples.run": "Run",
  "examples.explain": "Explain",
  "examples.editInConsole": "Edit in console",
  "examples.showRows": "Show {count} rows",
  "examples.hideRows": "Hide rows",
  "examples.showPlan": "Show plan",
  "examples.hidePlan": "Hide plan",
  "examples.dbExecution": "DB execution time",
  "examples.planning": "Planning",
  "examples.faster": "{who} is {ratio}x faster.",

  "result.noColumns": "No columns returned.",
  "result.truncated": "Showing the first {shown} of {total} rows.",

  "console.executionTime": "Execution time",
  "console.rows": "{count} rows",
  "console.roundTrip": "Browser round trip {time}",
  "console.failed": "Query failed",
  "console.close": "Close ✕",
  "console.running": "Running…",
  "console.execute": "Execute",
  "console.showResult": "Show result",
  "console.placeholder": "Type a SELECT statement. (Ctrl + Enter to run)",
  "console.hint": "Read-only (SELECT / WITH / EXPLAIN) · INSERT, UPDATE, DELETE and other writes are blocked · Ctrl + Enter to run",

  "error.empty": "Enter a SQL statement to run.",
  "error.multiple": "Only one SQL statement can be run at a time.",
  "error.notReadOnly": "Only read queries (SELECT / WITH / EXPLAIN) are allowed.",
  "error.forbidden": "{keyword} is not allowed. This console is read-only.",
  "error.sqlRequired": "sql is required.",
  "error.sqlTooLong": "SQL is too long.",
  "error.alreadyExplain": "This SQL already starts with EXPLAIN. Just run it.",
  "error.tableNotFound": "Table {name} was not found.",
};

export type MessageKey = keyof typeof en;

const ko: Record<MessageKey, string> = {
  "header.subtitle": "쿼리를 어떻게 쓰느냐에 따라 달라지는 성능을 직접 비교해 보세요",
  "nav.tables": "테이블",
  "nav.erd": "ERD",
  "nav.examples": "SQL 예제",

  "schema.errorTitle": "데이터베이스에 연결하지 못했습니다.",
  "schema.errorHelp": ".env.local 의 DATABASE_URL 을 확인하고, npm run db:setup 으로 샘플 데이터를 넣었는지 확인하세요.",

  "tables.title": "테이블",
  "tables.subtitle": "테이블을 선택하면 구조, 인덱스, 데이터를 보여줍니다.",
  "tables.selectPrompt": "왼쪽에서 테이블을 선택하세요.",
  "tables.column": "컬럼",
  "tables.type": "타입",
  "tables.keyRelation": "키 / 관계",
  "tables.indexes": "인덱스 ({count})",
  "tables.loading": "불러오는 중…",
  "tables.prev": "이전",
  "tables.next": "다음",
  "tables.page": "{page} / ~{total} 페이지",

  "erd.title": "ERD",
  "erd.subtitle": "테이블 간 관계(FK)입니다. 테이블을 클릭하면 위에서 데이터를 볼 수 있어요.",

  "examples.title": "SQL 예제 · 성능 비교",
  "examples.subtitle": "같은 결과를 내는 두 쿼리(A, B)의 실행 시간을 비교합니다.",
  "examples.intro":
    "시간은 Next.js 서버에서 측정한 쿼리 실행 + 결과 수신 시간입니다(네트워크 왕복 포함). DB 내부 실행 시간만 보려면 실행 계획을 누르세요(EXPLAIN ANALYZE). 첫 실행은 캐시가 비어 있어 느릴 수 있으니 여러 번 실행해서 비교해 보세요.",
  "examples.runBoth": "A, B 모두 실행",
  "examples.running": "실행 중…",
  "examples.run": "실행",
  "examples.explain": "실행 계획",
  "examples.editInConsole": "콘솔에서 편집",
  "examples.showRows": "결과 {count}행 보기",
  "examples.hideRows": "결과 숨기기",
  "examples.showPlan": "계획 보기",
  "examples.hidePlan": "계획 숨기기",
  "examples.dbExecution": "DB 실행 시간",
  "examples.planning": "계획 수립",
  "examples.faster": "{who} 가 {ratio}배 빠릅니다.",

  "result.noColumns": "반환된 컬럼이 없습니다.",
  "result.truncated": "전체 {total}행 중 앞의 {shown}행만 표시합니다.",

  "console.executionTime": "실행 시간",
  "console.rows": "{count}행",
  "console.roundTrip": "브라우저 왕복 {time}",
  "console.failed": "실행 실패",
  "console.close": "결과 닫기 ✕",
  "console.running": "실행 중…",
  "console.execute": "Execute",
  "console.showResult": "결과 보기",
  "console.placeholder": "SELECT 문을 입력하세요. (Ctrl + Enter 로 실행)",
  "console.hint": "조회(SELECT / WITH / EXPLAIN)만 가능합니다 · INSERT, UPDATE, DELETE 등은 차단됩니다 · Ctrl + Enter 로 실행",

  "error.empty": "실행할 SQL을 입력하세요.",
  "error.multiple": "한 번에 하나의 SQL문만 실행할 수 있습니다.",
  "error.notReadOnly": "조회 쿼리(SELECT / WITH / EXPLAIN)만 실행할 수 있습니다.",
  "error.forbidden": "{keyword} 는 사용할 수 없습니다. 조회만 가능합니다.",
  "error.sqlRequired": "sql 이 필요합니다.",
  "error.sqlTooLong": "SQL이 너무 깁니다.",
  "error.alreadyExplain": "이미 EXPLAIN 이 포함된 SQL입니다. 그냥 실행하세요.",
  "error.tableNotFound": "테이블 {name} 을(를) 찾을 수 없습니다.",
};

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ko };

export type Params = Record<string, string | number>;

function format(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

// The selected locale lives in memory and is mirrored to localStorage so it survives reloads.
const STORAGE_KEY = "sql-lab-locale";
const listeners = new Set<() => void>();
let current: Locale | null = null;

function readLocale(): Locale {
  if (current) return current;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    current = saved === "ko" || saved === "en" ? saved : "en";
  } catch {
    current = "en";
  }
  return current;
}

export function setLocale(locale: Locale) {
  current = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage may be unavailable (private mode); the choice still applies for this visit.
  }
  document.documentElement.lang = locale;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, readLocale, () => "en");
}

export type Translate = (key: MessageKey, params?: Params) => string;

export function useT(): Translate {
  const locale = useLocale();
  return useCallback((key, params) => format(MESSAGES[locale][key], params), [locale]);
}

/** Error thrown by the API helpers; code/params let the UI translate known errors. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly params?: Params,
  ) {
    super(message);
  }
}

export function useErrorText() {
  const t = useT();
  return useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.code && `error.${e.code}` in en) {
        return t(`error.${e.code}` as MessageKey, e.params);
      }
      return e instanceof Error ? e.message : String(e);
    },
    [t],
  );
}
