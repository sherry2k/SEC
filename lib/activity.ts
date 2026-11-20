import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, activityLog, users } from "@/db/schema";
import type { ActivityAction } from "@/lib/activity-labels";
import type { Role } from "@/lib/roles";

export type { ActivityAction };

export type ActivityFeedEntry = {
  id: number;
  userId: number | null;
  action: string;
  targetName: string;
  details: string | null;
  projectId: string | null;
  createdAt: Date;
  actorName: string | null;
};

// Shared by the NotificationBell dropdown (app/api/activity/route.ts) and
// the Dashboard home page's "Recent activity" card, so both read the same
// rows under the same master_admin-is-invisible-to-everyone-else rule
// (same as the Users page) rather than keeping two copies of this query.
export async function getRecentActivity(viewerRole: Role, limit: number): Promise<ActivityFeedEntry[]> {
  const rawEntries = await db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      action: activityLog.action,
      targetName: activityLog.targetName,
      details: activityLog.details,
      projectId: activityLog.projectId,
      createdAt: activityLog.createdAt,
      actorName: users.name,
      actorRole: users.role,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return rawEntries
    .filter((e) => viewerRole === "master_admin" || e.actorRole !== "master_admin")
    .map(({ actorRole: _actorRole, ...rest }) => rest);
}

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
