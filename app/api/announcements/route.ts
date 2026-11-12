import { NextResponse } from "next/server";
import { authorizePermissionApi } from "@/lib/auth";
import { createAnnouncement } from "@/lib/announcements";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  const auth = await authorizePermissionApi("announcements.manage");
  if (!auth.ok) return auth.response;

  const body: { title?: string; body?: string } = await req.json().catch(() => ({}));
  const title = body.title?.trim();
  const text = body.body?.trim();

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  await createAnnouncement({ title, body: text, createdBy: auth.user.id });
  await logActivity({ userId: auth.user.id, action: "announcement_created", targetName: title });

  return NextResponse.json({ ok: true });
}
