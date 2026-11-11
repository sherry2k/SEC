"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Check, X } from "lucide-react";

export default function AttendanceEditForm({
  userId,
  dateKey,
  initialCheckIn,
  initialLunchOut,
  initialLunchIn,
  initialCheckOut,
}: {
  userId: number;
  dateKey: string;
  initialCheckIn: string; // "HH:MM" or ""
  initialLunchOut: string;
  initialLunchIn: string;
  initialCheckOut: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [lunchOut, setLunchOut] = useState(initialLunchOut);
  const [lunchIn, setLunchIn] = useState(initialLunchIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/attendance/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: dateKey,
          checkInTime: checkIn || null,
          lunchOutTime: lunchOut || null,
          lunchInTime: lunchIn || null,
          checkOutTime: checkOut || null,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save that.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Edit attendance"
        className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]"
      >
        <Pencil size={13} />
      </button>
    );
  }

  const timeInputClass = "rounded-md border border-[var(--sec-line)] px-2 py-1 text-xs outline-none focus:border-[var(--sec-blue)]";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} aria-label="Check-in time" className={timeInputClass} />
      <span className="text-xs text-[var(--sec-muted)]">–</span>
      <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} aria-label="Check-out time" className={timeInputClass} />
      <span className="ml-1 text-xs text-[var(--sec-muted)]">Lunch</span>
      <input type="time" value={lunchOut} onChange={(e) => setLunchOut(e.target.value)} aria-label="Lunch-out time" className={timeInputClass} />
      <span className="text-xs text-[var(--sec-muted)]">–</span>
      <input type="time" value={lunchIn} onChange={(e) => setLunchIn(e.target.value)} aria-label="Lunch-in time" className={timeInputClass} />
      <button onClick={save} disabled={saving} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50" aria-label="Save">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button onClick={() => setOpen(false)} className="rounded-md p-1 text-[var(--sec-muted)] hover:bg-slate-100" aria-label="Cancel">
        <X size={13} />
      </button>
    </div>
  );
}
