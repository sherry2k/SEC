import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { markAllAnnouncementsRead } from "@/lib/announcements";

// Called only from the browser once the Announcements page has actually
// mounted (see components/MarkAnnouncementsRead.tsx) — never from the
// page's own server-side render, which Next.js can run from a background
// Link prefetch with nobody actually looking at the page.
export async function POST() {
  const auth = await authorizeApi();
  if (!auth.ok) return auth.response;

  await markAllAnnouncementsRead(auth.user.id);

  return NextResponse.json({ ok: true });
}
