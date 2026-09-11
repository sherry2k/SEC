"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ACTIVITY_LABELS, type ActivityAction } from "@/lib/activity-labels";

type ActivityEntry = {
  id: number;
  userId: number | null;
  action: string;
  targetName: string;
  details: string | null;
  projectId: string | null;
  createdAt: string;
  actorName: string | null;
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) return;
      const data: { entries: ActivityEntry[]; unreadCount: number } = await res.json();
      setEntries(data.entries);
      setUnreadCount(data.unreadCount);
      setLoaded(true);
    } catch {
      // silent — the bell just stays at its last known state
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = () => {
    setOpen((v) => !v);
    if (!loaded) load();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-[var(--sec-muted)] transition-colors hover:bg-slate-100 hover:text-[var(--sec-ink)]"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white shadow-lg">
          <div className="border-b border-[var(--sec-line)] px-4 py-2.5">
            <p className="text-sm font-bold text-[var(--sec-ink)]">Activity</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--sec-muted)]">Nothing yet.</p>
            ) : (
              entries.map((e) => {
                const row = (
                  <div className="px-4 py-3 hover:bg-slate-50">
                    <p className="text-sm text-[var(--sec-ink)]">
                      <span className="font-medium">{e.actorName ?? "Someone"}</span>{" "}
                      {ACTIVITY_LABELS[e.action as ActivityAction] ?? e.action}{" "}
                      <span className="font-medium">{e.targetName}</span>
                    </p>
                    {e.details && <p className="mt-0.5 text-xs text-[var(--sec-muted)]">{e.details}</p>}
                    <p className="mt-1 text-xs text-[var(--sec-muted)]">{relativeTime(e.createdAt)}</p>
                  </div>
                );
                return e.projectId ? (
                  <Link key={e.id} href={`/projects/${e.projectId}`} onClick={() => setOpen(false)} className="block border-b border-[var(--sec-line)] last:border-0">
                    {row}
                  </Link>
                ) : (
                  <div key={e.id} className="border-b border-[var(--sec-line)] last:border-0">
                    {row}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
