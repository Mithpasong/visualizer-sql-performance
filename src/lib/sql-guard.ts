// First-pass check that only allows read (SELECT) queries.
// The READ ONLY transaction does the real blocking; this exists to return a friendly error early.

const ALLOWED_FIRST_WORDS = new Set(["select", "with", "explain", "table", "values", "show"]);

const FORBIDDEN_WORDS = [
  "insert", "update", "delete", "merge", "upsert", "truncate", "drop", "alter", "create",
  "grant", "revoke", "copy", "call", "do", "lock", "vacuum", "reindex", "cluster",
  "comment", "refresh", "set", "reset", "begin", "commit", "rollback", "savepoint",
  "prepare", "execute", "deallocate", "listen", "notify", "discard", "security",
];
const FORBIDDEN_RE = new RegExp(`\\b(${FORBIDDEN_WORDS.join("|")})\\b`, "i");

/** Blank out comments, string literals, quoted identifiers and dollar-quoted strings */
function stripLiteralsAndComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\$([A-Za-z_]\w*)?\$[\s\S]*?\$\1\$/g, " '' ")
    .replace(/'(?:[^']|'')*'/g, " '' ")
    .replace(/"(?:[^"]|"")*"/g, ' "x" ');
}

export type GuardError = { code: string; message: string; params?: Record<string, string> };

/** Returns an error if the SQL is not allowed, otherwise null */
export function checkReadOnlySql(sql: string): GuardError | null {
  const stripped = stripLiteralsAndComments(sql).trim().replace(/;\s*$/, "");

  if (!stripped) return { code: "empty", message: "Enter a SQL statement to run." };
  if (stripped.includes(";")) {
    return { code: "multiple", message: "Only one SQL statement can be run at a time." };
  }

  const firstWord = stripped.match(/^\(*\s*([A-Za-z]+)/)?.[1]?.toLowerCase();
  if (!firstWord || !ALLOWED_FIRST_WORDS.has(firstWord)) {
    return { code: "notReadOnly", message: "Only read queries (SELECT / WITH / EXPLAIN) are allowed." };
  }

  const forbidden = stripped.match(FORBIDDEN_RE)?.[1];
  if (forbidden) {
    const keyword = forbidden.toUpperCase();
    return {
      code: "forbidden",
      message: `${keyword} is not allowed. This console is read-only.`,
      params: { keyword },
    };
  }

  return null;
}
