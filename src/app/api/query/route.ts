import { runReadOnly } from "@/lib/db";
import { checkReadOnlySql } from "@/lib/sql-guard";
import type { ExplainResponse } from "@/lib/types";

export async function POST(request: Request) {
  const { sql, explain } = (await request.json().catch(() => ({}))) as { sql?: string; explain?: boolean };

  if (typeof sql !== "string") {
    return Response.json({ error: "sql is required.", code: "sqlRequired" }, { status: 400 });
  }
  if (sql.length > 20_000) {
    return Response.json({ error: "SQL is too long.", code: "sqlTooLong" }, { status: 400 });
  }

  const guardError = checkReadOnlySql(sql);
  if (guardError) {
    const { message, ...rest } = guardError;
    return Response.json({ error: message, ...rest }, { status: 400 });
  }

  const statement = sql.trim().replace(/;\s*$/, "");

  try {
    if (!explain) {
      return Response.json(await runReadOnly(statement));
    }

    if (/^\s*explain\b/i.test(statement)) {
      return Response.json(
        { error: "This SQL already starts with EXPLAIN. Just run it.", code: "alreadyExplain" },
        { status: 400 },
      );
    }

    const result = await runReadOnly(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${statement}`, [], 10_000);
    const plan = result.rows.map((r) => String(r["QUERY PLAN"])).join("\n");
    const ms = (label: string) => {
      const m = plan.match(new RegExp(`${label} Time: ([\\d.]+) ms`));
      return m ? Number(m[1]) : null;
    };

    const body: ExplainResponse = {
      plan,
      planningMs: ms("Planning"),
      executionMs: ms("Execution"),
      elapsedMs: result.elapsedMs,
    };
    return Response.json(body);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
