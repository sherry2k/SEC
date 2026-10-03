import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, users } from "@/db/schema";
import { CATEGORY_LABELS, PROJECT_STATUS_LABELS, type ProjectCategory } from "@/lib/checklist";

export type PrintableProjectRow = {
  projectCode: string;
  municipalityNo: string | null;
  name: string;
  clientName: string | null;
  statusLabel: string;
  responsibleName: string | null;
  categoryLabels: string;
};

export async function getProjectsForPrint(): Promise<PrintableProjectRow[]> {
  const responsibleUsers = users;

  const rows = await db
    .select({
      id: projects.id,
      projectCode: projects.projectCode,
      municipalityNo: projects.municipalityNo,
      name: projects.name,
      clientName: projects.clientName,
      status: projects.status,
      responsibleName: responsibleUsers.name,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(responsibleUsers, eq(projects.responsibleId, responsibleUsers.id))
    .orderBy(desc(projects.updatedAt));

  const categoryLinks = await db.select().from(projectCategories);
  const categoriesByProject = new Map<string, ProjectCategory[]>();
  for (const link of categoryLinks) {
    const list = categoriesByProject.get(link.projectId) ?? [];
    list.push(link.category);
    categoriesByProject.set(link.projectId, list);
  }

  return rows.map((p) => ({
    projectCode: p.projectCode,
    municipalityNo: p.municipalityNo,
    name: p.name,
    clientName: p.clientName,
    statusLabel: PROJECT_STATUS_LABELS[p.status],
    responsibleName: p.responsibleName,
    categoryLabels: (categoriesByProject.get(p.id) ?? []).map((c) => CATEGORY_LABELS[c]).join(", "),
  }));
}
