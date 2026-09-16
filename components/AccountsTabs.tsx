"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/accounts/quotations", label: "Quotations" },
  { href: "/accounts/tax-invoices", label: "Tax Invoices" },
  { href: "/accounts/invoices", label: "Invoices" },
  { href: "/accounts/performa-invoices", label: "Performa Invoices" },
  { href: "/accounts/receipt-vouchers", label: "Receipt Vouchers" },
];

export default function AccountsTabs() {
  const pathname = usePathname();

  return (
    <div className="no-print mb-6 flex gap-1 border-b border-[var(--sec-line)]">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-[var(--sec-blue)] text-[var(--sec-blue)]"
                : "border-transparent text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
