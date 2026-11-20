"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  postedByLabel: string;
  createdAt: string;
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

// Separate from AnnouncementBanner (the passive, dismiss-on-sight one shown
// on every page) — this tracks announcementConfirmations, not
// announcementReads, so it keeps prompting even after the passive banner's
// been dismissed, until the person actually clicks Confirm.
export default function UnconfirmedAnnouncementBanner({ announcement }: { announcement: Announcement | null }) {
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!announcement || confirmed) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmed(true); // optimistic
    try {
      const res = await fetch(`/api/announcements/${announcement.id}/confirm`, { method: "POST" });
      if (!res.ok) setConfirmed(false);
    } catch {
      setConfirmed(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Megaphone size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">
          New announcement — <Link href="/announcements" className="hover:underline">{announcement.title}</Link>
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Posted by {announcement.postedByLabel} · {relativeTime(announcement.createdAt)}
        </p>
      </div>
      <button
        onClick={handleConfirm}
        disabled={confirming}
        className="shrink-0 rounded-md bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
      >
        Confirm you&apos;ve read this
      </button>
    </div>
  );
}
