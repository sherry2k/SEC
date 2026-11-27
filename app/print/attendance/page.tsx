import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { uaeDateKey } from "@/lib/attendance";
import { getAttendanceSummary, getDailyAttendanceDetail, weekRangeFor, monthRangeFor } from "@/lib/attendance-report";
import AttendancePrintBody from "@/components/AttendancePrintBody";
import { arabicFont } from "@/lib/fonts";

export default async function AttendancePrintSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; range?: string }>;
}) {
  await requirePermission("attendance.view");

  const { date: dateParam, range: rangeParam } = await searchParams;
  const dateKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : uaeDateKey(new Date());
  const range = rangeParam === "month" ? "month" : "week";

  // Same roles as the on-screen Attendance page — Staff, Finance and Admin
  // all self check-in, so the PDF should list the same people the screen
  // does, not just Staff.
  const staff = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(inArray(users.role, ["staff", "finance", "admin"]), eq(users.status, "approved")));

  const { start, end, label } = range === "week" ? weekRangeFor(dateKey) : monthRangeFor(dateKey);
  const rows = await getAttendanceSummary(staff, start, end);
  // Day-by-day check-in/check-out breakdown — both weekly and monthly PDFs,
  // same as the on-screen view.
  const dailyDetail = await getDailyAttendanceDetail(staff, start, end);

  return (
    <div
      className={`mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)] ${arabicFont.variable}`}
      style={{ fontFamily: "Arial, Helvetica, var(--font-arabic), sans-serif" }}
    >
      <AttendancePrintBody
        rows={rows}
        periodLabel={label}
        rangeLabel={range === "week" ? "Weekly" : "Monthly"}
        dailyDetail={dailyDetail}
      />
    </div>
  );
}
