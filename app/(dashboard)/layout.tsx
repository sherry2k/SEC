// Save as: app/(dashboard)/layout.tsx
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getTotalUnreadCount } from "@/lib/messages";
import Sidebar from "@/components/Sidebar";
import MobileShell from "@/components/MobileShell";
import DashboardTopbar from "@/components/DashboardTopbar";
import { getTodayAttendance } from "@/lib/attendance-data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // No role list passed: any approved user reaches the shell.
  // Each page/section inside applies its own requireRole for finer limits.
  const user = await requireRole();
  // Mirrors the "attendance.checkin" permission (lib/permissions.ts) rather
  // than its own hardcoded role list — Admin already has that permission,
  // but this fetch was still skipping Admin, so the Sidebar's Check-in
  // widget never had data to render even though the permission allowed it.
  const todayAttendance = can(user.role, "attendance.checkin") ? await getTodayAttendance(user.id) : null;

  // Only Admin/Master admin review leave requests, so only they need the
  // pending-count badge — everyone else never queries this table here.
  let pendingLeaveCount = 0;
  if (can(user.role, "leave_requests.review")) {
    const pending = await db.select({ id: leaveRequests.id }).from(leaveRequests).where(eq(leaveRequests.status, "pending"));
    pendingLeaveCount = pending.length;
  }

  // Everyone can use Messages, so every approved user needs their own
  // unread count for the Sidebar badge (unlike pendingLeaveCount above,
  // which only Admin/Master admin need).
  const unreadMessageCount = await getTotalUnreadCount(user.id);

  return (
    <div className="dashboard-shell flex h-screen flex-col overflow-hidden bg-[var(--sec-bg)] lg:flex-row">
      <MobileShell>
        <Sidebar
          user={user}
          todayAttendance={todayAttendance}
          pendingLeaveCount={pendingLeaveCount}
          unreadMessageCount={unreadMessageCount}
        />
      </MobileShell>
      <main className="flex-1 overflow-y-auto">
        <DashboardTopbar user={user} />
        <div className="dashboard-content-wrap w-full px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
