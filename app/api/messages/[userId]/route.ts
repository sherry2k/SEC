// Save as: app/api/messages/[userId]/route.ts
// :userId is the OTHER person in the conversation, not the viewer's own id.
import { NextResponse } from "next/server";
import { authorizePermissionApi } from "@/lib/auth";
import { getOrCreateConversation, listMessages, markSeen, sendMessage } from "@/lib/messages";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await authorizePermissionApi("messages.use");
  if (!auth.ok) return auth.response;

  const { userId } = await params;
  const otherUserId = Number(userId);
  if (!Number.isInteger(otherUserId) || otherUserId === auth.user.id) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }

  const conversation = await getOrCreateConversation(auth.user.id, otherUserId);
  await markSeen(conversation.id, auth.user.id);
  const thread = await listMessages(conversation.id);

  return NextResponse.json({
    conversationId: conversation.id,
    messages: thread.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt,
      seenAt: m.seenAt,
      fromMe: m.senderId === auth.user.id,
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await authorizePermissionApi("messages.use");
  if (!auth.ok) return auth.response;

  const { userId } = await params;
  const otherUserId = Number(userId);
  if (!Number.isInteger(otherUserId) || otherUserId === auth.user.id) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }

  const { body } = (await req.json()) as { body?: string };
  const text = body?.trim();
  if (!text) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: "Message is too long." }, { status: 400 });

  const conversation = await getOrCreateConversation(auth.user.id, otherUserId);
  const created = await sendMessage(conversation.id, auth.user.id, text);

  return NextResponse.json({
    message: {
      id: created.id,
      body: created.body,
      senderId: created.senderId,
      createdAt: created.createdAt,
      seenAt: created.seenAt,
      fromMe: true,
    },
  });
}
