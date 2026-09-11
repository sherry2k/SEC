import { requireRole } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // No role list passed: any approved user reaches the shell.
  // Each page/section inside applies its own requireRole for finer limits.
  const user = await requireRole();

  return (
    <div className="flex min-h-screen bg-[var(--sec-bg)]">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
