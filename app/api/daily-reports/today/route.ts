import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyWorkReports, dailyWorkReportEntries } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { uaeDateKey } from "@/lib/attendance";
import { getAttendanceTargetHours } from "@/lib/daily-report";

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("daily_report.submit");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const submit = body?.submit === true;
  const rawEntries: unknown[] = Array.isArray(body?.entries) ? body.entries : [];

  const entries = rawEntries
    .map((e) => {
      const record = e as Record<string, unknown>;
      const projectId = typeof record?.projectId === "string" && record.projectId ? record.projectId : null;
      const hours = Number(record?.hours);
      if (!Number.isFinite(hours) || hours <= 0) return null;
      return { projectId, hours };
    })
    .filter((e): e is { projectId: string | null; hours: number } => e !== null);

  const todayKey = uaeDateKey(new Date());
  const today = new Date(`${todayKey}T00:00:00.000Z`);

  if (submit) {
    const target = await getAttendanceTargetHours(auth.user.id, todayKey);
    if (target === null) {
      return NextResponse.json({ error: "Check out first — hours can't be matched until your attendance for today is complete." }, { status: 400 });
    }
    const total = Math.round(entries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100;
    if (Math.abs(total - target) > 0.01) {
      return NextResponse.json(
        { error: `Logged hours (${total}h) don't match today's attendance (${target}h) yet.` },
        { status: 400 }
      );
    }
  }

  const [existing] = await db
    .select({ id: dailyWorkReports.id })
    .from(dailyWorkReports)
    .where(and(eq(dailyWorkReports.userId, auth.user.id), eq(dailyWorkReports.date, today)))
    .limit(1);

  let reportId: string;
  if (existing) {
    reportId = existing.id;
    await db
      .update(dailyWorkReports)
      .set({ notes: notes || null, updatedAt: new Date(), ...(submit ? { submittedAt: new Date() } : {}) })
      .where(eq(dailyWorkReports.id, reportId));
  } else {
    const [created] = await db
      .insert(dailyWorkReports)
      .values({
        userId: auth.user.id,
        date: today,
        notes: notes || null,
        ...(submit ? { submittedAt: new Date() } : {}),
      })
      .returning({ id: dailyWorkReports.id });
    reportId = created.id;
  }

  await db.delete(dailyWorkReportEntries).where(eq(dailyWorkReportEntries.reportId, reportId));
  if (entries.length > 0) {
    await db.insert(dailyWorkReportEntries).values(entries.map((e) => ({ ...e, reportId, hours: String(e.hours) })));
  }

  return NextResponse.json({ success: true, submitted: submit });
}
