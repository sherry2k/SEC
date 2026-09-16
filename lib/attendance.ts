// Office hours and working-day rules, plus timezone-safe helpers. All
// timestamps are stored in UTC (Postgres timestamptz); the server that
// renders them may run in any timezone, so "is this Late" and "which
// calendar day is this" are always computed by shifting to UAE time
// explicitly, never by trusting the server's own local clock.

export const OFFICE_START_HOUR = 8;
export const OFFICE_START_MINUTE = 0;
export const UAE_UTC_OFFSET_HOURS = 4;

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
