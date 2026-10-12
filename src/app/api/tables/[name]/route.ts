import type { NextRequest } from "next/server";
import { runReadOnly } from "@/lib/db";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/tables/[name]">) {
  const { name } = await ctx.params;
  const params = request.nextUrl.searchParams;
  const pageSize = Math.min(Math.max(Number(params.get("pageSize")) || 50, 1), 200);
  const page = Math.max(Number(params.get("page")) || 0, 0);

  try {
    // Table names are identifiers and can't be bound as parameters, so check the table exists and quote it.
    const exists = await runReadOnly(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name = $1`,
      [name],
    );
    if (exists.rowCount === 0) {
      return Response.json(
        { error: `Table ${name} was not found.`, code: "tableNotFound", params: { name } },
        { status: 404 },
      );
    }

    const quoted = `"${name.replace(/"/g, '""')}"`;
    const result = await runReadOnly(
      `SELECT * FROM public.${quoted} ORDER BY 1 LIMIT $1 OFFSET $2`,
      [pageSize, page * pageSize],
    );
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
