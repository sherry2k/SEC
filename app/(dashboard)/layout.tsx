import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import Sidebar from "@/components/Sidebar";
import MobileShell from "@/components/MobileShell";
import DashboardTopbar from "@/components/DashboardTopbar";
import { getTodayAttendance } from "@/lib/attendance-data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // No role list passed: any approved user reaches the shell.
  // Each page/section inside applies its own requireRole for finer limits.
  const user = await requireRole();
  const todayAttendance = user.role === "staff" ? await getTodayAttendance(user.id) : null;

  // Only Admin/Master admin review leave requests, so only they need the
  // pending-count badge — everyone else never queries this table here.
  let pendingLeaveCount = 0;
  if (can(user.role, "leave_requests.review")) {
    const pending = await db.select({ id: leaveRequests.id }).from(leaveRequests).where(eq(leaveRequests.status, "pending"));
    pendingLeaveCount = pending.length;
  }

  return (
    <div className="dashboard-shell flex h-screen flex-col overflow-hidden bg-[var(--sec-bg)] lg:flex-row">
      <MobileShell>
        <Sidebar user={user} todayAttendance={todayAttendance} pendingLeaveCount={pendingLeaveCount} />
      </MobileShell>
      <main className="flex-1 overflow-y-auto">
        <DashboardTopbar user={user} />
        <div className="dashboard-content-wrap w-full px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
