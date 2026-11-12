import "server-only";
import { desc, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { announcements, announcementReads, users } from "@/db/schema";
import type { Role } from "@/lib/roles";

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  postedByLabel: string;
  isUnread: boolean;
};

// How the poster is credited. Admin shows its role so people know who can
// post these; Master Admin's role label is deliberately left off (same
// instinct as hiding "Master Admin" everywhere else in the app) — the
// announcement itself is fully visible, just without that tag next to the
// name.
function formatPostedBy(name: string, role: Role): string {
  return role === "master_admin" ? name : `${name} (Admin)`;
}

export async function createAnnouncement(params: { title: string; body: string; createdBy: number }): Promise<void> {
  await db.insert(announcements).values({
    title: params.title,
    body: params.body,
    createdBy: params.createdBy,
  });
}

// The single newest announcement this user hasn't opened yet — what the
// dashboard banner shows. null once they've read everything.
export async function getLatestUnreadAnnouncement(
  userId: number
): Promise<{ id: string; title: string; body: string; createdAt: Date; postedByLabel: string } | null> {
  const readIds = await db
    .select({ id: announcementReads.announcementId })
    .from(announcementReads)
    .where(eq(announcementReads.userId, userId));
  const readIdList = readIds.map((r) => r.id);

  const [row] = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      createdAt: announcements.createdAt,
      posterName: users.name,
      posterRole: users.role,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.createdBy, users.id))
    .where(readIdList.length ? notInArray(announcements.id, readIdList) : undefined)
    .orderBy(desc(announcements.createdAt))
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    postedByLabel: formatPostedBy(row.posterName ?? "Someone", row.posterRole ?? "admin"),
  };
}

export async function getUnreadAnnouncementCount(userId: number): Promise<number> {
  const readIds = await db
    .select({ id: announcementReads.announcementId })
    .from(announcementReads)
    .where(eq(announcementReads.userId, userId));
  const readIdList = readIds.map((r) => r.id);

  const rows = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(readIdList.length ? notInArray(announcements.id, readIdList) : undefined);
  return rows.length;
}

// Full history for the Announcements page. isUnread reflects read-state at
// the moment of this call — call this BEFORE markAllAnnouncementsRead, so
// the page can still show a "New" badge on the ones that were unread when
// the user opened it.
export async function getAllAnnouncementsForUser(userId: number): Promise<AnnouncementRow[]> {
  const readIds = await db
    .select({ id: announcementReads.announcementId })
    .from(announcementReads)
    .where(eq(announcementReads.userId, userId));
  const readIdSet = new Set(readIds.map((r) => r.id));

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      createdAt: announcements.createdAt,
      posterName: users.name,
      posterRole: users.role,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.createdBy, users.id))
    .orderBy(desc(announcements.createdAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
    postedByLabel: formatPostedBy(r.posterName ?? "Someone", r.posterRole ?? "admin"),
    isUnread: !readIdSet.has(r.id),
  }));
}

export async function updateAnnouncement(id: string, params: { title: string; body: string }): Promise<void> {
  await db.update(announcements).set({ title: params.title, body: params.body }).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: string): Promise<void> {
  // announcement_reads has ON DELETE CASCADE on this FK, so its rows for
  // this announcement go with it — no separate cleanup needed.
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function markAnnouncementRead(announcementId: string, userId: number): Promise<void> {
  await db
    .insert(announcementReads)
    .values({ announcementId, userId })
    .onConflictDoNothing();
}

// Marks every announcement that exists right now as read for this user —
// used when they open the full Announcements page, since seeing the list
// counts as having seen everything in it.
export async function markAllAnnouncementsRead(userId: number): Promise<void> {
  await db.execute(sql`
    insert into announcement_reads (announcement_id, user_id)
    select id, ${userId} from announcements
    on conflict do nothing
  `);
}
