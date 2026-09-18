import { requirePermission } from "@/lib/auth";
import { uaeDateKey } from "@/lib/attendance";
import { getReport, getAttendanceTargetHours, getTodayActivity } from "@/lib/daily-report";
import { getProjectOptions } from "@/lib/project-options";
import DailyReportForm from "@/components/DailyReportForm";

export default async function DailyReportPage() {
  const user = await requirePermission("daily_report.submit");

  const todayKey = uaeDateKey(new Date());
  const [{ report, entries }, targetHours, activity, projectOptions] = await Promise.all([
    getReport(user.id, todayKey),
    getAttendanceTargetHours(user.id, todayKey),
    getTodayActivity(user.id, todayKey),
    getProjectOptions(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Daily work report</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <DailyReportForm
            initialEntries={entries.map((e) => ({ projectId: e.projectId, hours: e.hours }))}
            initialNotes={report?.notes ?? ""}
            targetHours={targetHours}
            alreadySubmitted={!!report?.submittedAt}
            projectOptions={projectOptions}
          />
        </div>

        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Auto-tracked today</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--sec-muted)]">Nothing tracked yet today.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="w-14 shrink-0 text-xs text-[var(--sec-muted)]">{a.time}</span>
                  <span className="text-[var(--sec-ink)]">
                    {a.label}
                    {a.projectLabel && <span className="text-[var(--sec-blue)]"> · {a.projectLabel}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
