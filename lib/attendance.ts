// Office hours and working-day rules, plus timezone-safe helpers. All
// timestamps are stored in UTC (Postgres timestamptz); the server that
// renders them may run in any timezone, so "is this Late" and "which
// calendar day is this" are always computed by shifting to UAE time
// explicitly, never by trusting the server's own local clock.

export const OFFICE_START_HOUR = 8;
export const OFFICE_START_MINUTE = 0;
export const UAE_UTC_OFFSET_HOURS = 4;

// What counts as one full expected working day, for the weekly/monthly
// report's "Expected working hrs" column (expected = working days × this).
export const STANDARD_HOURS_PER_WORKING_DAY = 9;

// Working days: Monday–Saturday. JS getDay(): 0=Sun ... 6=Sat.
export const WORKING_WEEKDAYS = [1, 2, 3, 4, 5, 6];

function toUaeShifted(d: Date): Date {
  return new Date(d.getTime() + UAE_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

// A UAE calendar-day key ("YYYY-MM-DD") for any UTC timestamp — used to
// bucket a check-in into the right day even near midnight UAE time.
export function uaeDateKey(d: Date): string {
  const shifted = toUaeShifted(d);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWorkingDay(d: Date): boolean {
  const shifted = toUaeShifted(d);
  return WORKING_WEEKDAYS.includes(shifted.getUTCDay());
}

export function isLateCheckIn(checkInAt: Date): boolean {
  const shifted = toUaeShifted(checkInAt);
  const hours = shifted.getUTCHours();
  const minutes = shifted.getUTCMinutes();
  return hours > OFFICE_START_HOUR || (hours === OFFICE_START_HOUR && minutes > OFFICE_START_MINUTE);
}

export function formatUaeTime(d: Date): string {
  const shifted = toUaeShifted(d);
  const hours24 = shifted.getUTCHours();
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

// The lunch break is flexible — no fixed slot — but still capped at 1 hour;
// a break longer than this is flagged (amber), same "Late" treatment as a
// late check-in, purely informational.
export const LUNCH_CAP_MINUTES = 60;

export function lunchDurationMs(lunchOutAt: Date, lunchInAt: Date): number {
  return Math.max(0, lunchInAt.getTime() - lunchOutAt.getTime());
}

export function isOverLunchCap(lunchOutAt: Date, lunchInAt: Date): boolean {
  return lunchDurationMs(lunchOutAt, lunchInAt) > LUNCH_CAP_MINUTES * 60 * 1000;
}

// Net worked time for a day: checkout - checkin, minus the lunch break ONLY
// when one was actually recorded (both lunchOutAt and lunchInAt present). A
// day with no lunch tapped at all keeps its full checkin->checkout span —
// explicit call: don't silently assume a lunch nobody recorded.
export function netWorkedMs(checkInAt: Date, checkOutAt: Date, lunchOutAt: Date | null, lunchInAt: Date | null): number {
  const total = checkOutAt.getTime() - checkInAt.getTime();
  if (lunchOutAt && lunchInAt) {
    return Math.max(0, total - lunchDurationMs(lunchOutAt, lunchInAt));
  }
  return total;
}

export function formatDuration(startMs: number, endMs: number): string {
  const totalMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

// Converts a UAE wall-clock date+time ("YYYY-MM-DD", "HH:MM") into the
// correct UTC instant to store — used when Admin manually sets a time,
// since the <input type="time"> value is a plain wall-clock string with
// no timezone of its own.
export function uaeWallClockToUtc(dateKey: string, timeHHMM: string): Date {
  const naiveUtc = new Date(`${dateKey}T${timeHHMM}:00.000Z`);
  return new Date(naiveUtc.getTime() - UAE_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}
