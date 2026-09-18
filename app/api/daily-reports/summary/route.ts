import { NextRequest, NextResponse } from "next/server";
import { authorizePermissionApi } from "@/lib/auth";
import { getHoursSummary } from "@/lib/daily-report";

export async function GET(request: NextRequest) {
  const auth = await authorizePermissionApi("daily_report.view_all");
  if (!auth.ok) return auth.response;

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const groupBy = request.nextUrl.searchParams.get("groupBy") === "staff" ? "staff" : "project";

  if (!from || !to) {
    return NextResponse.json({ error: "Missing date range." }, { status: 400 });
  }

  const results = await getHoursSummary(from, to, groupBy);
  return NextResponse.json({ results });
}
