import Link from "next/link";
import { LayoutGrid, FolderKanban, Wallet, Users, Settings } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import SignOutButton from "@/components/SignOutButton";

// Server component: nav items are filtered by role before the page ever
// reaches the browser, not hidden with CSS after the fact.
export default function Sidebar({ user }: { user: CurrentUser }) {
  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutGrid, show: true },
    { href: "/projects", label: "Projects", icon: FolderKanban, show: can(user.role, "projects.view") },
    { href: "/accounts", label: "Accounts", icon: Wallet, show: can(user.role, "accounts.view") },
    { href: "/users", label: "User Management", icon: Users, show: can(user.role, "users.manage") },
    { href: "/settings", label: "Settings", icon: Settings, show: can(user.role, "settings.manage") },
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[var(--sec-line)] bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/images/logo.png" alt="SEC" className="h-8 w-8 object-contain" />
        <div className="leading-tight">
          <p className="font-display text-sm text-[var(--sec-ink)]">Solid Engineering</p>
          <p className="text-xs text-[var(--sec-muted)]">Consultancy</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--sec-ink)] transition-colors hover:bg-[var(--sec-blue)]/[0.06]"
              >
                <Icon size={17} className="text-[var(--sec-muted)]" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-[var(--sec-line)] px-3 py-3">
        <Link
          href="/profile"
          className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-[var(--sec-blue)]/[0.06]"
        >
          <div className="leading-tight">
            <p className="text-sm font-medium text-[var(--sec-ink)]">{user.name}</p>
            <p className="text-xs text-[var(--sec-muted)]">{ROLE_LABELS[user.role]}</p>
          </div>
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
