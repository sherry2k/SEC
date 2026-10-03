import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { uaeDateKey } from "@/lib/attendance";
import { getAttendanceSummary, weekRangeFor, monthRangeFor } from "@/lib/attendance-report";
import AttendancePrintBody from "@/components/AttendancePrintBody";

export default async function AttendancePrintSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; range?: string }>;
}) {
  await requirePermission("attendance.view");

  const { date: dateParam, range: rangeParam } = await searchParams;
  const dateKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : uaeDateKey(new Date());
  const range = rangeParam === "month" ? "month" : "week";

  const staff = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.role, "staff"), eq(users.status, "approved")));

  const { start, end, label } = range === "week" ? weekRangeFor(dateKey) : monthRangeFor(dateKey);
  const rows = await getAttendanceSummary(staff, start, end);

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)]">
      <AttendancePrintBody rows={rows} periodLabel={label} rangeLabel={range === "week" ? "Weekly" : "Monthly"} />
    </div>
  );
}
