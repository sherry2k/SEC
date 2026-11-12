// Save as: app/(dashboard)/announcements/page.tsx
import { Megaphone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getAllAnnouncementsForUser, markAllAnnouncementsRead } from "@/lib/announcements";
import AnnouncementComposer from "@/components/AnnouncementComposer";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function AnnouncementsPage() {
  const user = await requireRole();
  const canManage = can(user.role, "announcements.manage");

  // Unread state is read BEFORE marking everything read, so the "New"
  // badges below still reflect what was unread when this page was opened.
  const rows = await getAllAnnouncementsForUser(user.id);
  await markAllAnnouncementsRead(user.id);

  return (
    <div>
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
            <div key={a.id} className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Megaphone size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-[var(--sec-ink)]">{a.title}</p>
                    {a.isUnread && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[var(--sec-ink)]">{a.body}</p>
                  <p className="mt-2.5 text-xs text-[var(--sec-muted)]">
                    Posted by {a.postedByLabel} · {formatDate(a.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
