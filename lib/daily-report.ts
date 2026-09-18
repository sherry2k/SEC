import "server-only";
import { and, eq, gte, lt, lte, desc } from "drizzle-orm";
import { db } from "@/db";
import { dailyWorkReports, dailyWorkReportEntries, attendanceRecords, activityLog, projects, users } from "@/db/schema";
import { uaeDateKey, UAE_UTC_OFFSET_HOURS } from "@/lib/attendance";
import { ACTIVITY_LABELS, type ActivityAction } from "@/lib/activity-labels";

// Rounds a raw duration in hours to the nearest 15 minutes (0.25h) — asking
// someone to match an attendance total to the exact minute would be
// pointlessly fussy.
function roundToQuarterHour(hours: number): number {
  return Math.round(hours * 4) / 4;
}

// The UTC instant range covering one UAE calendar day — used to query
// attendance/activity by the same day boundaries uaeDateKey() uses.
function uaeDayRangeUtc(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  start.setTime(start.getTime() - UAE_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// The target hours a report must sum to before it can be submitted — null
// means "not checked out yet, can't compute a target."
export async function getAttendanceTargetHours(userId: number, dateKey: string): Promise<number | null> {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const [record] = await db
    .select({ checkInAt: attendanceRecords.checkInAt, checkOutAt: attendanceRecords.checkOutAt })
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, date)))
    .limit(1);

  if (!record?.checkInAt || !record?.checkOutAt) return null;

  const rawHours = (record.checkOutAt.getTime() - record.checkInAt.getTime()) / (1000 * 60 * 60);
  return roundToQuarterHour(rawHours);
}

export type DailyReportEntry = { id: string; projectId: string | null; projectLabel: string | null; hours: number };

export async function getReport(userId: number, dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const [report] = await db
    .select()
    .from(dailyWorkReports)
    .where(and(eq(dailyWorkReports.userId, userId), eq(dailyWorkReports.date, date)))
    .limit(1);

  if (!report) return { report: null, entries: [] as DailyReportEntry[] };

  const rows = await db
    .select({
      id: dailyWorkReportEntries.id,
      projectId: dailyWorkReportEntries.projectId,
      hours: dailyWorkReportEntries.hours,
      projectCode: projects.projectCode,
      municipalityNo: projects.municipalityNo,
    })
    .from(dailyWorkReportEntries)
    .leftJoin(projects, eq(dailyWorkReportEntries.projectId, projects.id))
    .where(eq(dailyWorkReportEntries.reportId, report.id));

  const entries: DailyReportEntry[] = rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    projectLabel: r.projectId ? r.municipalityNo || r.projectCode : "General / office work",
    hours: Number(r.hours),
  }));

  return { report, entries };
}

export type ActivityFeedItem = { time: string; label: string; projectLabel: string | null };

// The auto-tracked activity feed shown as reference on the report — pulled
// straight from the existing activity log, not a new tracking mechanism.
export async function getTodayActivity(userId: number, dateKey: string): Promise<ActivityFeedItem[]> {
  const { start, end } = uaeDayRangeUtc(dateKey);

  const rows = await db
    .select({
      createdAt: activityLog.createdAt,
      action: activityLog.action,
      details: activityLog.details,
      targetName: activityLog.targetName,
      projectCode: projects.projectCode,
      municipalityNo: projects.municipalityNo,
    })
    .from(activityLog)
    .leftJoin(projects, eq(activityLog.projectId, projects.id))
    .where(and(eq(activityLog.userId, userId), gte(activityLog.createdAt, start), lt(activityLog.createdAt, end)))
    .orderBy(desc(activityLog.createdAt));

  return rows.map((r) => ({
    time: r.createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    label: `${ACTIVITY_LABELS[r.action as ActivityAction] ?? r.action} ${r.targetName}${r.details ? ` — ${r.details}` : ""}`,
    projectLabel: r.projectCode ? r.municipalityNo || r.projectCode : null,
  }));
}

export type HoursSummaryRow = { label: string; hours: number };

// Total hours per project (or per staff member) across everyone, over a
// date range — what powers the Admin report.
export async function getHoursSummary(from: string, to: string, groupBy: "project" | "staff"): Promise<HoursSummaryRow[]> {
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);

  const rows = await db
    .select({
      hours: dailyWorkReportEntries.hours,
      projectId: dailyWorkReportEntries.projectId,
      projectCode: projects.projectCode,
      municipalityNo: projects.municipalityNo,
      userId: dailyWorkReports.userId,
      userName: users.name,
    })
    .from(dailyWorkReportEntries)
    .innerJoin(dailyWorkReports, eq(dailyWorkReportEntries.reportId, dailyWorkReports.id))
    .innerJoin(users, eq(dailyWorkReports.userId, users.id))
    .leftJoin(projects, eq(dailyWorkReportEntries.projectId, projects.id))
    .where(and(gte(dailyWorkReports.date, fromDate), lte(dailyWorkReports.date, toDate)));

  const totals = new Map<string, { label: string; hours: number }>();
  for (const r of rows) {
    const key = groupBy === "staff" ? `u-${r.userId}` : r.projectId ? `p-${r.projectId}` : "general";
    const label =
      groupBy === "staff" ? r.userName : r.projectId ? r.municipalityNo || r.projectCode || "—" : "General / office work";
    const current = totals.get(key) ?? { label: label ?? "—", hours: 0 };
    current.hours += Number(r.hours);
    totals.set(key, current);
  }

  return [...totals.values()]
    .map((t) => ({ label: t.label, hours: Math.round(t.hours * 100) / 100 }))
    .sort((a, b) => b.hours - a.hours);
}
