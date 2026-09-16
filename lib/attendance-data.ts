import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords } from "@/db/schema";
import { uaeDateKey } from "@/lib/attendance";

export async function getTodayAttendance(userId: number) {
  const todayKey = uaeDateKey(new Date());
  const today = new Date(`${todayKey}T00:00:00.000Z`);

  const [record] = await db
    .select({ checkInAt: attendanceRecords.checkInAt, checkOutAt: attendanceRecords.checkOutAt })
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, today)))
    .limit(1);

  return {
    checkInAt: record?.checkInAt ? record.checkInAt.toISOString() : null,
    checkOutAt: record?.checkOutAt ? record.checkOutAt.toISOString() : null,
  };
}
