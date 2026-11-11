import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { uaeDateKey } from "@/lib/attendance";

export async function POST() {
  const auth = await authorizePermissionApi("attendance.checkin");
  if (!auth.ok) return auth.response;

  const now = new Date();
  const todayKey = uaeDateKey(now);
  const today = new Date(`${todayKey}T00:00:00.000Z`);

  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, auth.user.id), eq(attendanceRecords.date, today)))
    .limit(1);

  if (!existing?.lunchOutAt) {
    return NextResponse.json({ error: "You haven't started your lunch break yet." }, { status: 400 });
  }
  if (existing.lunchInAt) {
    return NextResponse.json({ error: "You've already ended your lunch break today." }, { status: 400 });
  }

  await db
    .update(attendanceRecords)
    .set({ lunchInAt: now, updatedBy: auth.user.id, updatedAt: now })
    .where(eq(attendanceRecords.id, existing.id));

  return NextResponse.json({ success: true, lunchInAt: now.toISOString() });
}
