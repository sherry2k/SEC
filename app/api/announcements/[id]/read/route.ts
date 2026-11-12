import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { markAnnouncementRead } from "@/lib/announcements";

// Any approved user can mark an announcement read for themselves — this is
// what the dashboard banner's dismiss (×) calls, so the banner doesn't come
// back for that announcement once they've dismissed it.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await markAnnouncementRead(id, auth.user.id);

  return NextResponse.json({ ok: true });
}
