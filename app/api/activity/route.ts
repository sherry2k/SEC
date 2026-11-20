import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth";
import { getRecentActivity } from "@/lib/activity";

export async function GET() {
  const auth = await authorizeApi();
  if (!auth.ok) return auth.response;

  const [self] = await db
    .select({ lastLoginAt: users.lastLoginAt })
    .from(users)
    .where(eq(users.id, auth.user.id))
    .limit(1);

  const entries = await getRecentActivity(auth.user.role, 30);

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
