import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
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
