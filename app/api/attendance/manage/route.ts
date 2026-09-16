import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, users } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { uaeWallClockToUtc } from "@/lib/attendance";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("attendance.manage");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "number" ? body.userId : null;
  const dateKey = typeof body?.date === "string" ? body.date : "";
  const checkInTime = typeof body?.checkInTime === "string" ? body.checkInTime : null;
  const checkOutTime = typeof body?.checkOutTime === "string" ? body.checkOutTime : null;

  if (!userId || !DATE_PATTERN.test(dateKey)) {
    return NextResponse.json({ error: "Missing user or date." }, { status: 400 });
  }
  if (checkInTime !== null && !TIME_PATTERN.test(checkInTime)) {
    return NextResponse.json({ error: "Invalid check-in time." }, { status: 400 });
  }
  if (checkOutTime !== null && !TIME_PATTERN.test(checkOutTime)) {
    return NextResponse.json({ error: "Invalid check-out time." }, { status: 400 });
  }

  const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const checkInAt = checkInTime ? uaeWallClockToUtc(dateKey, checkInTime) : null;
  const checkOutAt = checkOutTime ? uaeWallClockToUtc(dateKey, checkOutTime) : null;

  const [existing] = await db
    .select({ id: attendanceRecords.id })
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, date)))
    .limit(1);

  if (existing) {
    await db
      .update(attendanceRecords)
      .set({ checkInAt, checkOutAt, updatedBy: auth.user.id, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, existing.id));
  } else {
    await db.insert(attendanceRecords).values({
      userId,
      date,
      checkInAt,
      checkOutAt,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });
  }

  return NextResponse.json({ success: true });
}
