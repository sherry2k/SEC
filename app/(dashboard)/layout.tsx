import { requireRole } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MobileShell from "@/components/MobileShell";
import DashboardTopbar from "@/components/DashboardTopbar";
import { getTodayAttendance } from "@/lib/attendance-data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // No role list passed: any approved user reaches the shell.
  // Each page/section inside applies its own requireRole for finer limits.
  const user = await requireRole();
  const todayAttendance = user.role === "staff" ? await getTodayAttendance(user.id) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--sec-bg)] lg:flex-row">
      <MobileShell>
        <Sidebar user={user} todayAttendance={todayAttendance} />
      </MobileShell>
      <main className="flex-1 overflow-y-auto">
        <DashboardTopbar user={user} />
        <div className="dashboard-content-wrap w-full px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
