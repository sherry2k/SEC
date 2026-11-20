import "server-only";
import { asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { announcements, announcementReads, announcementConfirmations, users } from "@/db/schema";
import type { Role } from "@/lib/roles";

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  postedByLabel: string;
  isUnread: boolean;
  // Explicit "I've read this" acknowledgment — see announcementConfirmations
  // in db/schema.ts for why this is separate from isUnread/announcementReads.
  isConfirmedByMe: boolean;
  confirmedCount: number;
  totalStaff: number;
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

// The single newest announcement this user hasn't explicitly confirmed yet
// — independent of isUnread/announcementReads above (dismissing the
// passive banner doesn't count as confirming). Drives the Dashboard's
// "Confirm you've read this" prompt. null once everything is confirmed.
export async function getLatestUnconfirmedAnnouncement(
  userId: number
): Promise<{ id: string; title: string; body: string; createdAt: Date; postedByLabel: string } | null> {
  const confirmedIds = await db
    .select({ id: announcementConfirmations.announcementId })
    .from(announcementConfirmations)
    .where(eq(announcementConfirmations.userId, userId));
  const confirmedIdList = confirmedIds.map((r) => r.id);

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
    .where(confirmedIdList.length ? notInArray(announcements.id, confirmedIdList) : undefined)
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

  // Confirmations are counted against the current roster of approved users
  // (everyone, including Admin/Master Admin — nobody's exempt) so the
  // denominator doesn't include anyone who's since been removed.
  const approvedUserIds = await db.select({ id: users.id }).from(users).where(eq(users.status, "approved"));
  const approvedUserIdSet = new Set(approvedUserIds.map((u) => u.id));
  const totalStaff = approvedUserIdSet.size;

  const allConfirmations = await db.select().from(announcementConfirmations);
  const confirmedUserIdsByAnnouncement = new Map<string, Set<number>>();
  for (const c of allConfirmations) {
    if (!approvedUserIdSet.has(c.userId)) continue;
    const set = confirmedUserIdsByAnnouncement.get(c.announcementId) ?? new Set<number>();
    set.add(c.userId);
    confirmedUserIdsByAnnouncement.set(c.announcementId, set);
  }

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

  return rows.map((r) => {
    const confirmedSet = confirmedUserIdsByAnnouncement.get(r.id) ?? new Set<number>();
    return {
      id: r.id,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
      postedByLabel: formatPostedBy(r.posterName ?? "Someone", r.posterRole ?? "admin"),
      isUnread: !readIdSet.has(r.id),
      isConfirmedByMe: confirmedSet.has(userId),
      confirmedCount: confirmedSet.size,
      totalStaff,
    };
  });
}

// Admin-only detail behind the expandable "X / Y confirmed" line — who
// exactly has and hasn't confirmed each announcement, by name. Only called
// for users with announcements.manage, so this never reaches a regular
// staff member's page payload.
export async function getAnnouncementConfirmationRosters(
  announcementIds: string[]
): Promise<Record<string, { name: string; confirmed: boolean }[]>> {
  if (announcementIds.length === 0) return {};

  const approvedUsers = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.status, "approved")).orderBy(asc(users.name));

  const confirmations = await db
    .select()
    .from(announcementConfirmations)
    .where(inArray(announcementConfirmations.announcementId, announcementIds));
  const confirmedByAnnouncement = new Map<string, Set<number>>();
  for (const c of confirmations) {
    const set = confirmedByAnnouncement.get(c.announcementId) ?? new Set<number>();
    set.add(c.userId);
    confirmedByAnnouncement.set(c.announcementId, set);
  }

  const result: Record<string, { name: string; confirmed: boolean }[]> = {};
  for (const id of announcementIds) {
    const confirmedSet = confirmedByAnnouncement.get(id) ?? new Set<number>();
    result[id] = approvedUsers.map((u) => ({ name: u.name, confirmed: confirmedSet.has(u.id) }));
  }
  return result;
}

export async function confirmAnnouncement(announcementId: string, userId: number): Promise<void> {
  await db.insert(announcementConfirmations).values({ announcementId, userId }).onConflictDoNothing();
}

export async function updateAnnouncement(id: string, params: { title: string; body: string }): Promise<void> {
  await db.update(announcements).set({ title: params.title, body: params.body }).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: string): Promise<void> {
  // announcement_reads and announcement_confirmations both have ON DELETE
  // CASCADE on this FK, so their rows for this announcement go with it —
  // no separate cleanup needed.
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
