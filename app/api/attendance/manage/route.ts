import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, users } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { uaeWallClockToUtc } from "@/lib/attendance";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseTimeField(value: unknown, dateKey: string, label: string): { ok: true; value: Date | null } | { ok: false; error: string } {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) {
    return { ok: false, error: `Invalid ${label} time.` };
  }
  return { ok: true, value: uaeWallClockToUtc(dateKey, value) };
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("attendance.manage");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "number" ? body.userId : null;
  const dateKey = typeof body?.date === "string" ? body.date : "";

  if (!userId || !DATE_PATTERN.test(dateKey)) {
    return NextResponse.json({ error: "Missing user or date." }, { status: 400 });
  }

  const checkInField = parseTimeField(body?.checkInTime, dateKey, "check-in");
  if (!checkInField.ok) return NextResponse.json({ error: checkInField.error }, { status: 400 });
  const lunchOutField = parseTimeField(body?.lunchOutTime, dateKey, "lunch-out");
  if (!lunchOutField.ok) return NextResponse.json({ error: lunchOutField.error }, { status: 400 });
  const lunchInField = parseTimeField(body?.lunchInTime, dateKey, "lunch-in");
  if (!lunchInField.ok) return NextResponse.json({ error: lunchInField.error }, { status: 400 });
  const checkOutField = parseTimeField(body?.checkOutTime, dateKey, "check-out");
  if (!checkOutField.ok) return NextResponse.json({ error: checkOutField.error }, { status: 400 });

  const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const checkInAt = checkInField.value;
  const lunchOutAt = lunchOutField.value;
  const lunchInAt = lunchInField.value;
  const checkOutAt = checkOutField.value;

  const [existing] = await db
    .select({ id: attendanceRecords.id })
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, date)))
    .limit(1);

  if (existing) {
    await db
      .update(attendanceRecords)
      .set({ checkInAt, lunchOutAt, lunchInAt, checkOutAt, updatedBy: auth.user.id, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, existing.id));
  } else {
    await db.insert(attendanceRecords).values({
      userId,
      date,
      checkInAt,
      lunchOutAt,
      lunchInAt,
      checkOutAt,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });
  }

  return NextResponse.json({ success: true });
}
