import { NextResponse } from "next/server";
import { authorizePermissionApi } from "@/lib/auth";
import { updateAnnouncement, deleteAnnouncement } from "@/lib/announcements";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("announcements.manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body: { title?: string; body?: string } = await req.json().catch(() => ({}));
  const title = body.title?.trim();
  const text = body.body?.trim();

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  await updateAnnouncement(id, { title, body: text });
  await logActivity({ userId: auth.user.id, action: "announcement_updated", targetName: title });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("announcements.manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await deleteAnnouncement(id);
  await logActivity({ userId: auth.user.id, action: "announcement_deleted", targetName: "an announcement" });

  return NextResponse.json({ ok: true });
}
