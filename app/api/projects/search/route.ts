import { NextRequest, NextResponse } from "next/server";
import { or, ilike, desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await authorizePermissionApi("projects.view");
  if (!auth.ok) return auth.response;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;
  const results = await db
    .select({
      id: projects.id,
      name: projects.name,
      projectCode: projects.projectCode,
      municipalityNo: projects.municipalityNo,
      clientName: projects.clientName,
    })
    .from(projects)
    .where(
      or(
        ilike(projects.name, pattern),
        ilike(projects.projectCode, pattern),
        ilike(projects.municipalityNo, pattern),
        ilike(projects.clientName, pattern)
      )
    )
    .orderBy(desc(projects.updatedAt))
    .limit(8);

  return NextResponse.json({ results });
}
