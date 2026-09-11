import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, activityLog } from "@/db/schema";
import type { ActivityAction } from "@/lib/activity-labels";

export type { ActivityAction };

export async function logActivity(params: {
  userId: number;
  projectId?: string | null;
  action: ActivityAction;
  targetName: string;
  details?: string | null;
}) {
  await db.insert(activityLog).values({
    userId: params.userId,
    projectId: params.projectId ?? null,
    action: params.action,
    targetName: params.targetName,
    details: params.details ?? null,
  });
}

// Stamps a project with who touched it and when — used by every mutation
// that isn't already an UPDATE on the projects row itself (checklist item
// edits, linking a category), so "Last updated" reflects any change to the
// project, not just edits to its own name/address fields.
export async function touchProject(projectId: string, userId: number) {
  await db.update(projects).set({ updatedAt: new Date(), updatedBy: userId }).where(eq(projects.id, projectId));
}
