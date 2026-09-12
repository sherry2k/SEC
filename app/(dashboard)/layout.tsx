import { requireRole } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MobileShell from "@/components/MobileShell";
import DashboardTopbar from "@/components/DashboardTopbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // No role list passed: any approved user reaches the shell.
  // Each page/section inside applies its own requireRole for finer limits.
  const user = await requireRole();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--sec-bg)] lg:flex-row">
      <MobileShell>
        <Sidebar user={user} />
      </MobileShell>
      <main className="flex-1 overflow-y-auto">
        <DashboardTopbar />
        <div className="dashboard-content-wrap mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
