import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, attendanceRecords } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import {
  uaeDateKey,
  isWorkingDay,
  isLateCheckIn,
  formatUaeTime,
  formatDuration,
} from "@/lib/attendance";
import AttendanceDatePicker from "@/components/AttendanceDatePicker";
import AttendanceEditForm from "@/components/AttendanceEditForm";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requirePermission("attendance.view");

  const { date: dateParam } = await searchParams;
  const dateKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : uaeDateKey(new Date());
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const workingDay = isWorkingDay(date);

  const staff = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.role, "staff"), eq(users.status, "approved")));

  const records = await db.select().from(attendanceRecords).where(eq(attendanceRecords.date, date));
  const recordByUserId = new Map(records.map((r) => [r.userId, r]));

  const rows = staff
    .map((person) => {
      const record = recordByUserId.get(person.id);
      const checkInAt = record?.checkInAt ?? null;
      const checkOutAt = record?.checkOutAt ?? null;
      return { ...person, checkInAt, checkOutAt };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const toTimeInput = (d: Date | null) => (d ? formatUaeTimeInput(d) : "");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Attendance</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {workingDay ? "Working day" : "Non-working day"} · Office starts 8:00 AM · Mon–Sat
          </p>
        </div>
        <AttendanceDatePicker dateKey={dateKey} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Check In</th>
              <th className="px-4 py-3 font-medium">Check Out</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const late = r.checkInAt ? isLateCheckIn(r.checkInAt) : false;
              const hours = r.checkInAt && r.checkOutAt ? formatDuration(r.checkInAt.getTime(), r.checkOutAt.getTime()) : "—";

              let statusLabel = "—";
              let statusClass = "text-[var(--sec-muted)]";
              if (!r.checkInAt) {
                if (workingDay) {
                  statusLabel = "Absent";
                  statusClass = "text-red-600";
                } else {
                  statusLabel = "Day off";
                }
              } else if (late) {
                statusLabel = "Late";
                statusClass = "text-amber-600";
              } else {
                statusLabel = "On time";
                statusClass = "text-emerald-600";
              }

              return (
                <tr key={r.id} className="border-b border-[var(--sec-line)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{r.name}</td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{r.checkInAt ? formatUaeTime(r.checkInAt) : "—"}</td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{r.checkOutAt ? formatUaeTime(r.checkOutAt) : "—"}</td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">
                    {hours}
                    {r.checkInAt && !r.checkOutAt && <span className="ml-1 text-xs">(still checked in)</span>}
                  </td>
                  <td className={`px-4 py-3 font-medium ${statusClass}`}>{statusLabel}</td>
                  <td className="px-4 py-3">
                    <AttendanceEditForm
                      userId={r.id}
                      dateKey={dateKey}
                      initialCheckIn={toTimeInput(r.checkInAt)}
                      initialCheckOut={toTimeInput(r.checkOutAt)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--sec-muted)]">No staff accounts to show yet.</p>
      )}
    </div>
  );
}

function formatUaeTimeInput(d: Date): string {
  // "HH:MM" in UAE local time, for pre-filling the edit form's <input type="time">
  const shifted = new Date(d.getTime() + 4 * 60 * 60 * 1000);
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
