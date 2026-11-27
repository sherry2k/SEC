import "server-only";
import { and, gte, lte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords } from "@/db/schema";
import { WORKING_WEEKDAYS, STANDARD_HOURS_PER_WORKING_DAY, isWorkingDay, formatDuration, formatUaeTime, netWorkedMs } from "@/lib/attendance";

export type StaffSummaryRow = {
  userId: number;
  name: string;
  daysPresent: number;
  daysAbsent: number;
  // Working days in the range × the standard hours-per-day — the same for
  // every row in a given report, since it isn't affected by who actually
  // showed up. totalHoursLabel (renamed "Actual Hrs" in the UI) is the real
  // sum of each day's check-in → check-out, unchanged from before.
  expectedHoursLabel: string;
  totalHoursLabel: string;
};

// Monday..Saturday of the week containing dateKey ("YYYY-MM-DD"), matching
// WORKING_WEEKDAYS — Sunday is excluded entirely, not just a non-working day.
export function weekRangeFor(dateKey: string): { start: Date; end: Date; label: string } {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  const dayOfWeek = d.getUTCDay(); // 0=Sun..6=Sat
  // Days to subtract to reach Monday — Sunday (0) counts as "6 days after
  // the prior Monday" here since the working week starts there.
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(d);
  start.setUTCDate(start.getUTCDate() - diffToMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 5); // Saturday
  const label = `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
  return { start, end, label };
}

export function monthRangeFor(dateKey: string): { start: Date; end: Date; label: string } {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return { start, end, label };
}

function countWorkingDaysInRange(start: Date, end: Date): number {
  // Capped at today — a future working day hasn't happened yet, so it
  // shouldn't count toward "expected" days when computing absences.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const effectiveEnd = end > today ? today : end;
  if (effectiveEnd < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= effectiveEnd) {
    if (WORKING_WEEKDAYS.includes(cursor.getUTCDay())) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export async function getAttendanceSummary(
  staff: { id: number; name: string }[],
  start: Date,
  end: Date
): Promise<StaffSummaryRow[]> {
  const userIds = staff.map((s) => s.id);
  const records = userIds.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.userId, userIds), gte(attendanceRecords.date, start), lte(attendanceRecords.date, end)))
    : [];

  const expectedWorkingDays = countWorkingDaysInRange(start, end);
  const expectedHoursLabel = formatDuration(0, expectedWorkingDays * STANDARD_HOURS_PER_WORKING_DAY * 60 * 60 * 1000);

  const recordsByUser = new Map<number, typeof records>();
  for (const r of records) {
    const list = recordsByUser.get(r.userId) ?? [];
    list.push(r);
    recordsByUser.set(r.userId, list);
  }

  return staff
    .map((person) => {
      const userRecords = recordsByUser.get(person.id) ?? [];
      const daysPresent = userRecords.filter((r) => r.checkInAt).length;
      const daysAbsent = Math.max(0, expectedWorkingDays - daysPresent);

      // Net of lunch when one was actually recorded for that day — a day
      // with no lunch tapped at all still counts its full checkin->checkout
      // span, same as before this feature existed.
      let totalMs = 0;
      for (const r of userRecords) {
        if (r.checkInAt && r.checkOutAt) totalMs += netWorkedMs(r.checkInAt, r.checkOutAt, r.lunchOutAt, r.lunchInAt);
      }
      const totalHoursLabel = totalMs > 0 ? formatDuration(0, totalMs) : "0h 0m";

      return { userId: person.id, name: person.name, daysPresent, daysAbsent, expectedHoursLabel, totalHoursLabel };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type DailyDetailRow = {
  dateKey: string;
  dateLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  hoursLabel: string;
  present: boolean;
};

export type StaffDailyDetail = {
  userId: number;
  name: string;
  days: DailyDetailRow[];
};

// Day-by-day check-in/check-out detail for a range, one row per working day
// per person — used by the monthly PDF's per-employee breakdown, below the
// summary table. Absent working days are included (marked present: false)
// rather than skipped, same "Expected" framing as the summary report.
export async function getDailyAttendanceDetail(
  staff: { id: number; name: string }[],
  start: Date,
  end: Date
): Promise<StaffDailyDetail[]> {
  const userIds = staff.map((s) => s.id);
  const records = userIds.length
    ? await db
        .select()
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.userId, userIds), gte(attendanceRecords.date, start), lte(attendanceRecords.date, end)))
    : [];

  const recordByUserAndDay = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    recordByUserAndDay.set(`${r.userId}:${r.date.getTime()}`, r);
  }

  // Same "don't count a future day" cap as the summary report.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const effectiveEnd = end > today ? today : end;

  const workingDays: Date[] = [];
  if (effectiveEnd >= start) {
    const cursor = new Date(start);
    while (cursor <= effectiveEnd) {
      if (WORKING_WEEKDAYS.includes(cursor.getUTCDay())) workingDays.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return staff
    .map((person) => {
      const days: DailyDetailRow[] = workingDays.map((day) => {
        const dateLabel = day.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        const dateKey = day.toISOString().slice(0, 10);
        const record = recordByUserAndDay.get(`${person.id}:${day.getTime()}`);

        if (record?.checkInAt) {
          const hoursLabel = record.checkOutAt
            ? formatDuration(0, netWorkedMs(record.checkInAt, record.checkOutAt, record.lunchOutAt, record.lunchInAt))
            : "—";
          return {
            dateKey,
            dateLabel,
            checkInLabel: formatUaeTime(record.checkInAt),
            checkOutLabel: record.checkOutAt ? formatUaeTime(record.checkOutAt) : "—",
            hoursLabel,
            present: true,
          };
        }
        return { dateKey, dateLabel, checkInLabel: "—", checkOutLabel: "—", hoursLabel: "—", present: false };
      });
      return { userId: person.id, name: person.name, days };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export { isWorkingDay };
