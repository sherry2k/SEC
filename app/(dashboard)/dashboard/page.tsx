import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";

// Placeholder home page — stat cards land here once the Projects phase
// (checklist tree, categories) is built.
export default async function DashboardHome() {
  const user = await requireRole();

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">
        {ROLE_LABELS[user.role]}
      </p>
      <h1 className="font-bold mt-1 text-3xl text-[var(--sec-ink)]">
        Welcome back, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-sm text-[var(--sec-muted)]">
        Project stat cards and recent activity will appear here once the Projects
        module is built.
      </p>
    </div>
  );
}
