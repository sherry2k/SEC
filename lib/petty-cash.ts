import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { pettyCashEntries, users } from "@/db/schema";
import { EXPENSE_CATEGORY_SUGGESTIONS, shiftMonthKey } from "@/lib/office-ledger";

export { EXPENSE_CATEGORY_SUGGESTIONS, shiftMonthKey };

export const DEPOSIT_SOURCE_SUGGESTIONS = ["Bank Transfer", "Replenishment", "Cash Deposit"];

// "YYYY-MM-DD", using local date parts (not toISOString, which would shift
// across a UTC day boundary for someone in UAE) — same helper as
// lib/office-ledger.ts's toDateValue, duplicated rather than imported since
// office-ledger.ts doesn't export it.
function toDateValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type PettyCashRow = {
  id: string;
  type: "deposit" | "expense";
  dateLabel: string;
  dateValue: string; // for prefilling the edit form's <input type="date">
  sortKey: number;
  category: string; // "" for a deposit with no source noted
  description: string;
  amount: number;
  createdByName: string | null;
};

export type PettyCashSummary = {
  monthKey: string;
  depositTotal: number;
  expenseTotal: number;
  net: number;
  depositRows: PettyCashRow[];
  expenseRows: PettyCashRow[];
  expenseByCategory: { category: string; amount: number }[];
};

// All-time balance — deliberately not scoped to any month, since the cash
// box's actual balance carries forward regardless of which month is being
// viewed. Computed live from every entry ever recorded, same
// live-computed-not-stored pattern as the rest of this app's financial
// summaries (avoids a stored running total silently drifting out of sync).
export async function getPettyCashBalance(): Promise<number> {
  const rows = await db.select({ type: pettyCashEntries.type, amount: pettyCashEntries.amount }).from(pettyCashEntries);
  return rows.reduce((sum, r) => sum + (r.type === "deposit" ? Number(r.amount) : -Number(r.amount)), 0);
}

// monthKey is "YYYY-MM".
export async function getPettyCashSummary(monthKey: string): Promise<PettyCashSummary> {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const monthRows = await db
    .select({
      id: pettyCashEntries.id,
      type: pettyCashEntries.type,
      date: pettyCashEntries.date,
      category: pettyCashEntries.category,
      description: pettyCashEntries.description,
      amount: pettyCashEntries.amount,
      createdByName: users.name,
    })
    .from(pettyCashEntries)
    .leftJoin(users, eq(pettyCashEntries.createdBy, users.id))
    .where(and(gte(pettyCashEntries.date, start), lt(pettyCashEntries.date, end)));

  const toRow = (r: (typeof monthRows)[number]): PettyCashRow => ({
    id: r.id,
    type: r.type as "deposit" | "expense",
    dateLabel: r.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateValue: toDateValue(r.date),
    sortKey: r.date.getTime(),
    category: r.category ?? "",
    description: r.description ?? "",
    amount: Number(r.amount),
    createdByName: r.createdByName,
  });

  const depositRows = monthRows.filter((r) => r.type === "deposit").map(toRow).sort((a, b) => b.sortKey - a.sortKey);
  const expenseRows = monthRows.filter((r) => r.type === "expense").map(toRow).sort((a, b) => b.sortKey - a.sortKey);

  const depositTotal = depositRows.reduce((sum, r) => sum + r.amount, 0);
  const expenseTotal = expenseRows.reduce((sum, r) => sum + r.amount, 0);

  const byCategory = new Map<string, number>();
  for (const r of expenseRows) {
    const key = r.category || "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + r.amount);
  }

  return {
    monthKey,
    depositTotal,
    expenseTotal,
    net: depositTotal - expenseTotal,
    depositRows,
    expenseRows,
    expenseByCategory: [...byCategory.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
  };
}

export type PettyCashMonthSummary = { monthKey: string; monthLabel: string; depositTotal: number; expenseTotal: number; net: number };

export type PettyCashRangeSummary = {
  months: PettyCashMonthSummary[];
  totalDeposit: number;
  totalExpense: number;
  totalNet: number;
  expenseByCategory: { category: string; amount: number }[];
};

// Trailing numMonths ending at endMonthKey — same trend-view pattern as
// lib/office-ledger.ts's getOfficeLedgerRangeSummary.
export async function getPettyCashRangeSummary(endMonthKey: string, numMonths: number): Promise<PettyCashRangeSummary> {
  const monthKeys: string[] = [];
  let key = endMonthKey;
  for (let i = 0; i < numMonths; i++) {
    monthKeys.unshift(key);
    key = shiftMonthKey(key, -1);
  }

  const summaries = await Promise.all(monthKeys.map((k) => getPettyCashSummary(k)));

  const months: PettyCashMonthSummary[] = monthKeys.map((k, i) => ({
    monthKey: k,
    monthLabel: new Date(`${k}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    depositTotal: summaries[i].depositTotal,
    expenseTotal: summaries[i].expenseTotal,
    net: summaries[i].net,
  }));

  const totalDeposit = months.reduce((sum, m) => sum + m.depositTotal, 0);
  const totalExpense = months.reduce((sum, m) => sum + m.expenseTotal, 0);

  const byCategory = new Map<string, number>();
  for (const s of summaries) {
    for (const c of s.expenseByCategory) {
      byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + c.amount);
    }
  }

  return {
    months,
    totalDeposit,
    totalExpense,
    totalNet: totalDeposit - totalExpense,
    expenseByCategory: [...byCategory.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
  };
}
