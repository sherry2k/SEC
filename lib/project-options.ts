import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

export async function getProjectOptions() {
  const rows = await db
    .select({ id: projects.id, projectCode: projects.projectCode, municipalityNo: projects.municipalityNo, name: projects.name })
    .from(projects)
    .orderBy(desc(projects.createdAt));

  return rows.map((p) => ({
    id: p.id,
    label: `${p.municipalityNo || p.projectCode} — ${p.name}`,
  }));
}
