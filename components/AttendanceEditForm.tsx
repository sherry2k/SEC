"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Check, X } from "lucide-react";

export default function AttendanceEditForm({
  userId,
  dateKey,
  initialCheckIn,
  initialCheckOut,
}: {
  userId: number;
  dateKey: string;
  initialCheckIn: string; // "HH:MM" or ""
  initialCheckOut: string; // "HH:MM" or ""
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
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

  return (
    <div className="flex items-center gap-1.5">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <input
        type="time"
        value={checkIn}
        onChange={(e) => setCheckIn(e.target.value)}
        aria-label="Check-in time"
        className="rounded-md border border-[var(--sec-line)] px-2 py-1 text-xs outline-none focus:border-[var(--sec-blue)]"
      />
      <span className="text-xs text-[var(--sec-muted)]">–</span>
      <input
        type="time"
        value={checkOut}
        onChange={(e) => setCheckOut(e.target.value)}
        aria-label="Check-out time"
        className="rounded-md border border-[var(--sec-line)] px-2 py-1 text-xs outline-none focus:border-[var(--sec-blue)]"
      />
      <button onClick={save} disabled={saving} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50" aria-label="Save">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button onClick={() => setOpen(false)} className="rounded-md p-1 text-[var(--sec-muted)] hover:bg-slate-100" aria-label="Cancel">
        <X size={13} />
      </button>
    </div>
  );
}
