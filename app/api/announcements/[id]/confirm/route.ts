import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { confirmAnnouncement } from "@/lib/announcements";

// Explicit "I've read this" acknowledgment — any approved user (same gate
// as the passive mark-read routes; reading/confirming announcements has no
// separate permission). Deliberately its own route rather than folded into
// /read, since confirming is a one-way, user-initiated action the admin
// relies on, not a side effect of the page simply being open.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await confirmAnnouncement(id, auth.user.id);

  return NextResponse.json({ ok: true });
}
