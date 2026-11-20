"use client";

import { useEffect, useState } from "react";

// Date on its own line, day + time on the second — ticks on the client only
// (the server render shows nothing, filled in a moment after mount) so the
// server-rendered HTML never has to guess the viewer's clock and can't
// drift out of sync with it.
export default function DashboardClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return <div className="hidden h-[34px] sm:block" />;

  const dateLabel = now.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const dayLabel = now.toLocaleDateString(undefined, { weekday: "long" });
  const timeLabel = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="hidden text-right leading-tight sm:block">
      <p className="text-sm font-bold text-[var(--sec-ink)]">{dateLabel}</p>
      <p className="mt-0.5 text-xs text-[var(--sec-muted)]">
        {dayLabel} · {timeLabel}
      </p>
    </div>
  );
}
