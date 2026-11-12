"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  postedByLabel: string;
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

export default function AnnouncementBanner({ announcement }: { announcement: Announcement | null }) {
  const [dismissed, setDismissed] = useState(false);

  if (!announcement || dismissed) return null;

  const preview = announcement.body.length > 160 ? `${announcement.body.slice(0, 160)}…` : announcement.body;

  const dismiss = () => {
    setDismissed(true);
    fetch(`/api/announcements/${announcement.id}/read`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="relative mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 pr-10 sm:px-5">
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-3 rounded-md p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600"
      >
        <X size={15} />
      </button>
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        <Megaphone size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-tight text-blue-900">{announcement.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-blue-800">{preview}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-blue-600">
          <span>
            Posted by {announcement.postedByLabel} · {relativeTime(announcement.createdAt)}
          </span>
          <Link href="/announcements" className="font-semibold hover:underline">
            Read more →
          </Link>
        </div>
      </div>
    </div>
  );
}
