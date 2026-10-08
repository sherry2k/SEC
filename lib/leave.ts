// Leave request types and statuses, plus the shared working-day
// calculation used both when a request is submitted (to compute total
// days) and on the generated letter.

import { isWorkingDay } from "@/lib/attendance";

export const LEAVE_TYPES = ["annual", "sick", "emergency", "unpaid"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  emergency: "Emergency Leave",
  unpaid: "Unpaid Leave",
};

// The heading on the generated letter — "Leave Approval Letter" for the
// plain case, a specific title for the others, matching what was agreed
// before building this.
export const LEAVE_TYPE_LETTER_TITLES: Record<LeaveType, string> = {
  annual: "Leave Approval Letter",
  sick: "Sick Leave Letter",
  emergency: "Emergency Leave Letter",
  unpaid: "Unpaid Leave Letter",
};

export const LEAVE_TYPE_BADGE_STYLES: Record<LeaveType, string> = {
  annual: "border-[var(--sec-blue)]/25 bg-[var(--sec-blue)]/[0.08] text-[var(--sec-blue)]",
  sick: "border-rose-200 bg-rose-50 text-rose-700",
  emergency: "border-amber-200 bg-amber-50 text-amber-700",
  unpaid: "border-slate-300 bg-slate-100 text-slate-600",
};

export const LEAVE_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number];

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const LEAVE_STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

// Inclusive day count between two "YYYY-MM-DD" dates, counting only
// working days (Mon–Sat) — mirrors the same rule Attendance already uses,
// so "5 days leave" means 5 working days, not 5 calendar days including
// a Sunday nobody would've been in the office for anyway.
export function countWorkingDays(startDateKey: string, endDateKey: string): number {
  const start = new Date(`${startDateKey}T00:00:00.000Z`);
  const end = new Date(`${endDateKey}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isWorkingDay(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}
