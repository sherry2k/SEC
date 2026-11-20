"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";

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

// One combined row for Admin/Master Admin — previously this was two
// separate banners stacked on top of each other (a personal "Confirm
// you've read this" prompt, plus a separate team-wide "X of Y confirmed"
// status), which read as duplicated when the admin is also one of the
// people who needs to confirm. Regular staff (who have no oversight to
// show) still just get UnconfirmedAnnouncementBanner on its own.
export default function AnnouncementStatusBanner({
  announcementId,
  title,
  postedByLabel,
  createdAt,
  myName,
  initialConfirmedByMe,
  initialConfirmedCount,
  totalStaff,
  initialPendingNames,
}: {
  announcementId: string;
  title: string;
  postedByLabel: string;
  createdAt: string;
  myName: string;
  initialConfirmedByMe: boolean;
  initialConfirmedCount: number;
  totalStaff: number;
  initialPendingNames: string[];
}) {
  const [confirmed, setConfirmed] = useState(initialConfirmedByMe);
  const [confirming, setConfirming] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(initialConfirmedCount);
  const [pendingNames, setPendingNames] = useState(initialPendingNames);

  const handleConfirm = async () => {
    setConfirming(true);
    // Optimistic — flips the button, bumps the count, and drops my own
    // name out of the pending list immediately.
    setConfirmed(true);
    setConfirmedCount((c) => c + 1);
    setPendingNames((names) => names.filter((n) => n !== myName));
    try {
      const res = await fetch(`/api/announcements/${announcementId}/confirm`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      setConfirmed(false);
      setConfirmedCount((c) => c - 1);
      setPendingNames((names) => [...names, myName]);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        <Megaphone size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-blue-900">
          <Link href="/announcements" className="hover:underline">
            {title}
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-blue-700">
          Posted by {postedByLabel} · {relativeTime(createdAt)} · {confirmedCount} of {totalStaff} staff confirmed
          {pendingNames.length > 0 ? ` — pending: ${pendingNames.join(", ")}` : " — everyone has confirmed"}
        </p>
      </div>
      {confirmed ? (
        <Link href="/announcements" className="shrink-0 text-xs font-semibold text-blue-700 hover:underline">
          View announcement →
        </Link>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="shrink-0 rounded-md bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          Confirm you&apos;ve read this
        </button>
      )}
    </div>
  );
}
