"use client";

import { useState } from "react";
import { LogIn, LogOut, Coffee, Loader2 } from "lucide-react";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Four steps, in order: check in -> (optional, flexible-timing) lunch out
// -> lunch in -> check out. The widget always shows exactly the one button
// for whatever the person hasn't done yet today.
type Phase = "pre-checkin" | "working" | "on-lunch" | "post-lunch" | "done";

function phaseOf(checkInAt: string | null, lunchOutAt: string | null, lunchInAt: string | null, checkOutAt: string | null): Phase {
  if (checkOutAt) return "done";
  if (lunchOutAt && !lunchInAt) return "on-lunch";
  if (!checkInAt) return "pre-checkin";
  if (lunchInAt) return "post-lunch";
  return "working";
}

const ACTION_BY_PHASE: Record<Exclude<Phase, "done">, { endpoint: string; label: string; icon: typeof LogIn }> = {
  "pre-checkin": { endpoint: "check-in", label: "Check In", icon: LogIn },
  working: { endpoint: "lunch-start", label: "Start Lunch", icon: Coffee },
  "on-lunch": { endpoint: "lunch-end", label: "End Lunch", icon: Coffee },
  "post-lunch": { endpoint: "check-out", label: "Check Out", icon: LogOut },
};

export default function AttendanceWidget({
  initialCheckInAt,
  initialLunchOutAt,
  initialLunchInAt,
  initialCheckOutAt,
}: {
  initialCheckInAt: string | null;
  initialLunchOutAt: string | null;
  initialLunchInAt: string | null;
  initialCheckOutAt: string | null;
}) {
  const [checkInAt, setCheckInAt] = useState(initialCheckInAt);
  const [lunchOutAt, setLunchOutAt] = useState(initialLunchOutAt);
  const [lunchInAt, setLunchInAt] = useState(initialLunchInAt);
  const [checkOutAt, setCheckOutAt] = useState(initialCheckOutAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const phase = phaseOf(checkInAt, lunchOutAt, lunchInAt, checkOutAt);

  const handleClick = async () => {
    if (phase === "done") return;
    const { endpoint } = ACTION_BY_PHASE[phase];
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance/${endpoint}`, { method: "POST" });
      const data: { error?: string; checkInAt?: string; lunchOutAt?: string; lunchInAt?: string; checkOutAt?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save that.");
        return;
      }
      if (data.checkInAt) setCheckInAt(data.checkInAt);
      if (data.lunchOutAt) setLunchOutAt(data.lunchOutAt);
      if (data.lunchInAt) setLunchInAt(data.lunchInAt);
      if (data.checkOutAt) setCheckOutAt(data.checkOutAt);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  if (phase === "done") {
    return (
      <div className="rounded-md bg-white/5 px-3 py-2 text-xs text-white/70">
        <p>Checked in {formatTime(checkInAt!)}</p>
        {lunchOutAt && lunchInAt && (
          <p>
            Lunch {formatTime(lunchOutAt)} – {formatTime(lunchInAt)}
          </p>
        )}
        <p>Checked out {formatTime(checkOutAt!)}</p>
      </div>
    );
  }

  const { label, icon: Icon } = ACTION_BY_PHASE[phase];

  return (
    <div className="px-1">
      {checkInAt && <p className="mb-1.5 px-2 text-xs text-white/60">Checked in {formatTime(checkInAt)}</p>}
      {phase === "on-lunch" && lunchOutAt && <p className="mb-1.5 px-2 text-xs text-white/60">On lunch since {formatTime(lunchOutAt)}</p>}
      {phase === "post-lunch" && lunchOutAt && lunchInAt && (
        <p className="mb-1.5 px-2 text-xs text-white/60">
          Lunch {formatTime(lunchOutAt)} – {formatTime(lunchInAt)}
        </p>
      )}
      {error && <p className="mb-1.5 px-2 text-xs text-red-300">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          phase === "pre-checkin" ? "bg-white text-[var(--sec-blue-deep)] hover:bg-white/90" : "bg-white/10 text-white hover:bg-white/15"
        }`}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            <Icon size={15} />
            {label}
          </>
        )}
      </button>
    </div>
  );
}
