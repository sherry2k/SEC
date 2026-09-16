"use client";

import { useState } from "react";
import { LogIn, LogOut, Loader2 } from "lucide-react";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AttendanceWidget({
  initialCheckInAt,
  initialCheckOutAt,
}: {
  initialCheckInAt: string | null;
  initialCheckOutAt: string | null;
}) {
  const [checkInAt, setCheckInAt] = useState(initialCheckInAt);
  const [checkOutAt, setCheckOutAt] = useState(initialCheckOutAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    const action = checkInAt ? "check-out" : "check-in";
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance/${action}`, { method: "POST" });
      const data: { error?: string; checkInAt?: string; checkOutAt?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save that.");
        return;
      }
      if (action === "check-in" && data.checkInAt) setCheckInAt(data.checkInAt);
      if (action === "check-out" && data.checkOutAt) setCheckOutAt(data.checkOutAt);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  if (checkInAt && checkOutAt) {
    return (
      <div className="rounded-md bg-white/5 px-3 py-2 text-xs text-white/70">
        <p>Checked in {formatTime(checkInAt)}</p>
        <p>Checked out {formatTime(checkOutAt)}</p>
      </div>
    );
  }

  return (
    <div className="px-1">
      {checkInAt && <p className="mb-1.5 px-2 text-xs text-white/60">Checked in {formatTime(checkInAt)}</p>}
      {error && <p className="mb-1.5 px-2 text-xs text-red-300">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          checkInAt ? "bg-white/10 text-white hover:bg-white/15" : "bg-white text-[var(--sec-blue-deep)] hover:bg-white/90"
        }`}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : checkInAt ? (
          <>
            <LogOut size={15} />
            Check Out
          </>
        ) : (
          <>
            <LogIn size={15} />
            Check In
          </>
        )}
      </button>
    </div>
  );
}
