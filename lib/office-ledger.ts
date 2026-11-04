import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { officeLedgerEntries, receiptVouchers, receiptVoucherItems, salarySlips, salarySlipItems, users } from "@/db/schema";
import { calcReceiptVoucherTotals } from "@/lib/receipt-voucher-calc";
import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";

export const EXPENSE_CATEGORY_SUGGESTIONS = [
  "Salaries",
  "Office Rental",
  "Electricity Bill",
  "Etisalat Bill",
  "Telephone Bill",
  "Office Items",
  "Internet Bill",
  "Maintenance",
  "Insurance",
  "Government Fees",
  "Miscellaneous",
];

export const INCOME_CATEGORY_SUGGESTIONS = ["Other Income"];

// Parses "DD/MM/YYYY" (how Receipt Voucher issue dates are stored) into a
// sortable timestamp — same convention used in lib/project-finance.ts.
function parseDMY(s: string): number {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return 0;
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).getTime();
}

// "YYYY-MM-DD", using local date parts (not toISOString, which would shift
// across a UTC day boundary for someone in UAE).
function toDateValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type LedgerRow = {
  id: string;
  type: "income" | "expense";
  dateLabel: string;
  // "YYYY-MM-DD", for prefilling the edit form's <input type="date">.
  // Unused for source "receipt_voucher" rows (those aren't editable here).
  dateValue: string;
  sortKey: number;
  category: string;
  description: string;
  amount: number;
  source: "manual" | "receipt_voucher" | "salary_slip";
  createdByName: string | null;
};

export type OfficeLedgerSummary = {
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  incomeRows: LedgerRow[];
  expenseRows: LedgerRow[];
  expenseByCategory: { category: string; amount: number }[];
};

// monthKey is "YYYY-MM".
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// monthKey is "YYYY-MM".
export async function getOfficeLedgerSummary(monthKey: string): Promise<OfficeLedgerSummary> {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const manualRows = await db
    .select({
      id: officeLedgerEntries.id,
      type: officeLedgerEntries.type,
      date: officeLedgerEntries.date,
      category: officeLedgerEntries.category,
      description: officeLedgerEntries.description,
      amount: officeLedgerEntries.amount,
      createdByName: users.name,
    })
    .from(officeLedgerEntries)
    .leftJoin(users, eq(officeLedgerEntries.createdBy, users.id))
    .where(and(gte(officeLedgerEntries.date, start), lt(officeLedgerEntries.date, end)));

  const manualLedgerRows: LedgerRow[] = manualRows.map((r) => ({
    id: r.id,
    type: r.type as "income" | "expense",
    dateLabel: r.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateValue: toDateValue(r.date),
    sortKey: r.date.getTime(),
    category: r.category,
    description: r.description ?? "",
    amount: Number(r.amount),
    source: "manual",
    createdByName: r.createdByName,
  }));

  // Receipt Vouchers issued this month count as income automatically —
  // computed live here, not duplicated into this table. Only vouchers whose
  // status is "received" are counted: a voucher still in "draft" means the
  // payment hasn't actually been confirmed yet, so including it would show
  // money as already-paid when it may never land — the same bug pattern
  // already fixed in lib/account-project-finance.ts and
  // lib/account-project-statement.ts, just missed here.
  const allVouchers = await db.select().from(receiptVouchers);
  const monthVouchers = allVouchers.filter((v) => {
    if (v.status !== "received") return false;
    const t = parseDMY(v.issueDate);
    return t >= start.getTime() && t < end.getTime();
  });

  const voucherRows: LedgerRow[] = [];
  for (const v of monthVouchers) {
    const items = await db.select().from(receiptVoucherItems).where(eq(receiptVoucherItems.voucherId, v.id));
    const totals = calcReceiptVoucherTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(v.vatRatePercent)
    );
    voucherRows.push({
      id: v.id,
      type: "income",
      dateLabel: v.issueDate,
      dateValue: "", // not editable here — see LedgerRow.dateValue
      sortKey: parseDMY(v.issueDate),
      category: "Receipt Voucher",
      description: `${v.voucherNo} — ${v.toName ?? ""}`,
      amount: totals.total,
      source: "receipt_voucher",
      createdByName: null,
    });
  }

  // Salary Slips marked "paid" for this pay month count as a Salaries
  // expense automatically — same live-computed pattern as Receipt Vouchers
  // counting as income once "received", just on the expense side and
  // matched by payMonth (already "YYYY-MM") instead of a parsed issue date.
  const allSlips = await db.select().from(salarySlips);
  const monthSlips = allSlips.filter((s) => s.status === "paid" && s.payMonth === monthKey);

  const salaryRows: LedgerRow[] = [];
  for (const s of monthSlips) {
    const items = await db.select().from(salarySlipItems).where(eq(salarySlipItems.slipId, s.id));
    const totals = calcSalarySlipTotals(
      items.map((i) => ({ type: i.type as "earning" | "deduction", description: i.description, amount: Number(i.amount) }))
    );
    salaryRows.push({
      id: s.id,
      type: "expense",
      dateLabel: s.issueDate,
      dateValue: "", // not editable here — see LedgerRow.dateValue
      sortKey: parseDMY(s.issueDate),
      category: "Salaries",
      description: `${s.slipNo} — ${s.employeeName}`,
      amount: totals.netPay,
      source: "salary_slip",
      createdByName: null,
    });
  }

  const incomeRows = [...manualLedgerRows.filter((r) => r.type === "income"), ...voucherRows].sort((a, b) => b.sortKey - a.sortKey);
  const expenseRows = [...manualLedgerRows.filter((r) => r.type === "expense"), ...salaryRows].sort((a, b) => b.sortKey - a.sortKey);

  const incomeTotal = incomeRows.reduce((sum, r) => sum + r.amount, 0);
  const expenseTotal = expenseRows.reduce((sum, r) => sum + r.amount, 0);

  const byCategory = new Map<string, number>();
  for (const r of expenseRows) {
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + r.amount);
  }

  return {
    incomeTotal,
    expenseTotal,
    net: incomeTotal - expenseTotal,
    incomeRows,
    expenseRows,
    expenseByCategory: [...byCategory.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
  };
}

export type MonthSummary = { monthKey: string; monthLabel: string; incomeTotal: number; expenseTotal: number; net: number };

export type OfficeLedgerRangeSummary = {
  months: MonthSummary[];
  totalIncome: number;
  totalExpense: number;
  totalNet: number;
  expenseByCategory: { category: string; amount: number }[];
};

// A trend view across several trailing months, ending at endMonthKey — for
// seeing "how much did rent cost over the last 6 months" at a glance,
// which the single-month view can't show.
export async function getOfficeLedgerRangeSummary(endMonthKey: string, numMonths: number): Promise<OfficeLedgerRangeSummary> {
  const monthKeys: string[] = [];
  let key = endMonthKey;
  for (let i = 0; i < numMonths; i++) {
    monthKeys.unshift(key);
    key = shiftMonthKey(key, -1);
  }

  const summaries = await Promise.all(monthKeys.map((k) => getOfficeLedgerSummary(k)));

  const months: MonthSummary[] = monthKeys.map((k, i) => ({
    monthKey: k,
    monthLabel: new Date(`${k}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    incomeTotal: summaries[i].incomeTotal,
    expenseTotal: summaries[i].expenseTotal,
    net: summaries[i].net,
  }));

  const totalIncome = months.reduce((sum, m) => sum + m.incomeTotal, 0);
  const totalExpense = months.reduce((sum, m) => sum + m.expenseTotal, 0);

  const byCategory = new Map<string, number>();
  for (const s of summaries) {
    for (const c of s.expenseByCategory) {
      byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + c.amount);
    }
  }

  return {
    months,
    totalIncome,
    totalExpense,
    totalNet: totalIncome - totalExpense,
    expenseByCategory: [...byCategory.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
  };
}
