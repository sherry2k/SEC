"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LeaveRequestsTabs({ canReview, pendingCount }: { canReview: boolean; pendingCount: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/leave-requests", label: "My Requests" },
    ...(canReview ? [{ href: "/leave-requests/review", label: "Review", badge: pendingCount }] : []),
  ];

  return (
    <div className="no-print mb-6 flex gap-1 border-b border-[var(--sec-line)]">
      {tabs.map((tab) => {
        const active = tab.href === "/leave-requests" ? pathname === "/leave-requests" : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-[var(--sec-blue)] text-[var(--sec-blue)]"
                : "border-transparent text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
            }`}
          >
            {tab.label}
            {"badge" in tab && tab.badge! > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
