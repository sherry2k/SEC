import "server-only";
import { and, asc, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";

// Always userAId < userBId so (userAId, userBId) uniquely identifies the
// conversation between two people regardless of who messaged first.
function orderedPair(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

async function findConversation(userAId: number, userBId: number) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userAId, userAId), eq(conversations.userBId, userBId)))
    .limit(1);
  return row ?? null;
}

export async function getOrCreateConversation(userId: number, otherUserId: number) {
  const [userAId, userBId] = orderedPair(userId, otherUserId);

  const existing = await findConversation(userAId, userBId);
  if (existing) return existing;

  try {
    const [created] = await db.insert(conversations).values({ userAId, userBId }).returning();
    return created;
  } catch {
    // Race with a concurrent request creating the same pair — the unique
    // constraint on (userAId, userBId) rejects the duplicate insert, so the
    // row now exists; fetch it.
    const row = await findConversation(userAId, userBId);
    if (!row) throw new Error("Failed to create conversation");
    return row;
  }
}

// Master admin is invisible to everyone else in Messages — not listed in
// their conversation list and not reachable by user id either (enforced
// here, not just hidden in the UI). Master admin itself can message anyone.
// Sheraz's explicit call: everyone else can see and message each other
// freely, master admin opts out of being seen.
export async function canViewerMessage(viewerRole: string, otherUserId: number): Promise<boolean> {
  if (viewerRole === "master_admin") return true;
  const [other] = await db.select({ role: users.role }).from(users).where(eq(users.id, otherUserId)).limit(1);
  return other?.role !== "master_admin";
}

async function countUnread(conversationId: string, viewerId: number) {
  const rows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(eq(messages.conversationId, conversationId), ne(messages.senderId, viewerId), isNull(messages.seenAt))
    );
  return rows.length;
}

export type DirectoryEntry = {
  userId: number;
  name: string;
  role: string;
  conversationId: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  lastMessageFromMe: boolean;
  unreadCount: number;
};

// Every other approved user, each annotated with their conversation with the
// current user if one exists yet — this is what drives the conversation
// list, merging "people you can message" and "people you have messaged"
// into one view rather than requiring a conversation to exist first.
// Master admin is excluded from this list for every viewer except master
// admin itself (see canViewerMessage above).
export async function getDirectory(currentUserId: number, currentUserRole: string): Promise<DirectoryEntry[]> {
  const peopleFilter =
    currentUserRole === "master_admin"
      ? and(eq(users.status, "approved"), ne(users.id, currentUserId))
      : and(eq(users.status, "approved"), ne(users.id, currentUserId), ne(users.role, "master_admin"));

  const people = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(peopleFilter);

  const convRows = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.userAId, currentUserId), eq(conversations.userBId, currentUserId)));

  const convByOtherUser = new Map(convRows.map((c) => [c.userAId === currentUserId ? c.userBId : c.userAId, c]));

  const entries: DirectoryEntry[] = [];
  for (const person of people) {
    const conv = convByOtherUser.get(person.id);
    if (!conv) {
      entries.push({
        userId: person.id,
        name: person.name,
        role: person.role,
        conversationId: null,
        lastMessage: null,
        lastMessageAt: null,
        lastMessageFromMe: false,
        unreadCount: 0,
      });
      continue;
    }

    const [last] = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const unreadCount = await countUnread(conv.id, currentUserId);

    entries.push({
      userId: person.id,
      name: person.name,
      role: person.role,
      conversationId: conv.id,
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.createdAt ?? null,
      lastMessageFromMe: last ? last.senderId === currentUserId : false,
      unreadCount,
    });
  }

  // Most recently active conversation first, then alphabetical for people
  // with no messages yet.
  return entries.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.name.localeCompare(b.name);
  });
}

// Total unseen messages across every conversation the user is part of — for
// the Sidebar's badge, same pattern as pendingLeaveCount. A conversation
// with master admin can't exist for anyone but master admin (blocked at
// send/create time), so this needs no extra filtering.
export async function getTotalUnreadCount(userId: number): Promise<number> {
  const convRows = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(or(eq(conversations.userAId, userId), eq(conversations.userBId, userId)));
  if (convRows.length === 0) return 0;

  const convIds = convRows.map((c) => c.id);
  const rows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(inArray(messages.conversationId, convIds), ne(messages.senderId, userId), isNull(messages.seenAt)));
  return rows.length;
}

export async function listMessages(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}

export async function sendMessage(conversationId: string, senderId: number, body: string) {
  const [created] = await db.insert(messages).values({ conversationId, senderId, body }).returning();
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
  return created;
}

// Marks every message in this conversation NOT sent by the viewer as seen —
// called whenever the viewer opens or polls that thread, which is what
// produces the read-receipt behavior on the sender's side.
export async function markSeen(conversationId: string, viewerId: number) {
  await db
    .update(messages)
    .set({ seenAt: new Date() })
    .where(
      and(eq(messages.conversationId, conversationId), ne(messages.senderId, viewerId), isNull(messages.seenAt))
    );
}
