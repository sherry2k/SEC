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

  if (existing?.checkInAt) {
    return NextResponse.json({ error: "You've already checked in today." }, { status: 400 });
  }

  if (existing) {
    await db
      .update(attendanceRecords)
      .set({ checkInAt: now, updatedBy: auth.user.id, updatedAt: now })
      .where(eq(attendanceRecords.id, existing.id));
  } else {
    await db.insert(attendanceRecords).values({
      userId: auth.user.id,
      date: today,
      checkInAt: now,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });
  }

  return NextResponse.json({ success: true, checkInAt: now.toISOString() });
}
