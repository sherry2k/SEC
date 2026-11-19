// Shared "All time / This month / Previous month" filter for the Accounts
// document list pages (Quotations, Tax Invoices, Invoices, Performa
// Invoices, Receipt Vouchers). Same searchParams-driven pill-link pattern
// already used by Salary Slips' `month` filter and Account Projects'
// `sort` filter — filters against each table's `createdAt` timestamp,
// which is the one date field reliably present and parseable on every one
// of these tables (the free-text `issueDate` string isn't).
export const PERIOD_OPTIONS = [
  { key: "all", label: "All time" },
  { key: "this-month", label: "This month" },
  { key: "prev-month", label: "Previous month" },
] as const;

export type PeriodKey = (typeof PERIOD_OPTIONS)[number]["key"];

export function resolvePeriodKey(period: string | undefined): PeriodKey {
  return PERIOD_OPTIONS.some((o) => o.key === period) ? (period as PeriodKey) : "all";
}

export function isInPeriod(date: Date, period: PeriodKey): boolean {
  if (period === "all") return true;
  const now = new Date();
  const monthsBack = period === "this-month" ? 0 : 1;
  const target = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
}
