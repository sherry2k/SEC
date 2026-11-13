import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, accountProjects } from "@/db/schema";
import { nextDocumentCode } from "@/lib/sequences";

// The Statement of Account has no saved row of its own (it's generated
// fresh from the project + its linked documents every time), so its
// document number lives directly on the project (projects.soaNo) and is
// assigned lazily, the first time anyone opens or prints it — not at
// project creation, since not every project ends up needing one. Once
// assigned it's reused forever, same as every other document's number.
export async function getOrAssignSoaNo(projectId: string): Promise<string> {
  const [project] = await db.select({ soaNo: projects.soaNo }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (project?.soaNo) return project.soaNo;

  const soaNo = await nextDocumentCode("SOA");
  await db.update(projects).set({ soaNo }).where(eq(projects.id, projectId));
  return soaNo;
}

// Same thing, for an Account Project's Statement of Account
// (lib/account-project-statement.ts) — a separate table, but sharing the
// same "SOA" sequence above so the numbers stay unique app-wide no matter
// which kind of project a given statement was generated from.
export async function getOrAssignAccountProjectSoaNo(accountProjectId: string): Promise<string> {
  const [accountProject] = await db
    .select({ soaNo: accountProjects.soaNo })
    .from(accountProjects)
    .where(eq(accountProjects.id, accountProjectId))
    .limit(1);
  if (accountProject?.soaNo) return accountProject.soaNo;

  const soaNo = await nextDocumentCode("SOA");
  await db.update(accountProjects).set({ soaNo }).where(eq(accountProjects.id, accountProjectId));
  return soaNo;
}
