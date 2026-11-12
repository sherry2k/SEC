"use client";

import { useEffect } from "react";

// Renders nothing — just fires once the Announcements page has actually
// mounted in the browser, which only happens on a real visit (unlike the
// page's own server-side render, which Next.js can also run from a
// background Link prefetch). That's what marks every announcement read for
// this user, so the dashboard banner clears for announcements they've
// genuinely opened and not a moment before.
export default function MarkAnnouncementsRead() {
  useEffect(() => {
    fetch("/api/announcements/mark-all-read", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
