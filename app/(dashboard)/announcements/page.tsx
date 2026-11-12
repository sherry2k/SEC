// Save as: app/(dashboard)/announcements/page.tsx
import { Megaphone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getAllAnnouncementsForUser } from "@/lib/announcements";
import AnnouncementComposer from "@/components/AnnouncementComposer";
import AnnouncementRow from "@/components/AnnouncementRow";
import MarkAnnouncementsRead from "@/components/MarkAnnouncementsRead";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function AnnouncementsPage() {
  const user = await requireRole();
  const canManage = can(user.role, "announcements.manage");

  // "New" badges below reflect what's unread right now. Marking it all read
  // happens client-side (see MarkAnnouncementsRead) rather than here — a
  // server component's render can run from a background prefetch (the
  // Sidebar link, or this page's own Link elsewhere) with nobody actually
  // looking at the page, so a write in the render path marks things read
  // that nobody has seen yet. A real visit only happens once this component
  // mounts in the browser.
  const rows = await getAllAnnouncementsForUser(user.id);

  return (
    <div>
      <MarkAnnouncementsRead />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Announcements</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "announcement" : "announcements"}
          </p>
        </div>
        {canManage && <AnnouncementComposer posterLabel={user.role === "master_admin" ? user.name : `${user.name} (Admin)`} />}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <Megaphone size={28} className="mx-auto mb-3 text-[var(--sec-muted)]" />
          <p className="text-sm text-[var(--sec-muted)]">No announcements yet.</p>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {rows.map((a) => (
            <AnnouncementRow
              key={a.id}
              canManage={canManage}
              announcement={{
                id: a.id,
                title: a.title,
                body: a.body,
                postedByLabel: a.postedByLabel,
                createdAtLabel: formatDate(a.createdAt),
                isUnread: a.isUnread,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
