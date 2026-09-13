"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FolderKanban, Wallet, Users, Settings } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import SignOutButton from "@/components/SignOutButton";

// Client component so the active nav item can be highlighted from the
// current route (usePathname). The permission checks below are pure and
// synchronous — no data fetching happens here, so this stays just as safe
// as a server component for hiding items a role shouldn't see.
export default function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutGrid, show: true },
    { href: "/projects", label: "Projects", icon: FolderKanban, show: can(user.role, "projects.view") },
    { href: "/accounts", label: "Accounts", icon: Wallet, show: can(user.role, "accounts.view") },
    { href: "/users", label: "User Management", icon: Users, show: can(user.role, "users.manage") },
    { href: "/settings", label: "Settings", icon: Settings, show: can(user.role, "settings.manage") },
  ];

  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-[var(--sec-blue-deep)]">
      {/* Roofline watermark, echoing the login page's brand panel — the one
          deliberately branded surface, kept quiet so the nav stays legible. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
        viewBox="0 0 260 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <line x1="0" y1="140" x2="280" y2="380" stroke="white" strokeWidth="3" />
        <line x1="40" y1="80" x2="260" y2="260" stroke="white" strokeWidth="3" />
        <line x1="120" y1="300" x2="120" y2="500" stroke="white" strokeWidth="3" />
        <line x1="180" y1="240" x2="180" y2="500" stroke="white" strokeWidth="3" />
        <line x1="90" y1="500" x2="220" y2="500" stroke="white" strokeWidth="3" />
      </svg>

      <div className="relative flex items-center gap-2.5 px-5 py-5">
        <img src="/images/logo-white.png" alt="" className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Solid Engineering</p>
          <p className="text-xs text-white/55">Consultancy</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-0.5 px-3 py-2">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-white bg-white/10 font-medium text-white"
                    : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={17} className={active ? "text-white" : "text-white/50"} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="relative border-t border-white/10 px-3 py-3">
        <Link
          href="/profile"
          className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-white/5"
        >
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-white/50">{ROLE_LABELS[user.role]}</p>
          </div>
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
