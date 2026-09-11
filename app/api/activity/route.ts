import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth";

export async function GET() {
  const auth = await authorizeApi();
  if (!auth.ok) return auth.response;

  const [self] = await db
    .select({ lastLoginAt: users.lastLoginAt })
    .from(users)
    .where(eq(users.id, auth.user.id))
    .limit(1);

  const entries = await db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      action: activityLog.action,
      targetName: activityLog.targetName,
      details: activityLog.details,
      projectId: activityLog.projectId,
      createdAt: activityLog.createdAt,
      actorName: users.name,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(30);

  // "Unread" = happened since this user's last login, and wasn't their own
  // action — they don't need to be told about their own edits. This is an
  // approximation capped by the 30-row page above, which is fine for a
  // notification badge (nobody needs an exact count past "a lot").
  const lastLogin = self?.lastLoginAt ?? null;
  const unreadCount = lastLogin
    ? entries.filter((e) => e.createdAt > lastLogin && e.userId !== auth.user.id).length
    : 0;

  return NextResponse.json({ entries, unreadCount });
}
