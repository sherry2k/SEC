import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";

export type SalaryReportRow = {
  slipId: string;
  slipNo: string;
  employeeName: string;
  designation: string;
  earningsTotal: number;
  deductionsTotal: number;
  netPay: number;
};

export type SalaryReport = {
  monthKey: string;
  rows: SalaryReportRow[];
  totals: { earningsTotal: number; deductionsTotal: number; netPay: number };
};

// Only "paid" slips for the month count — same rule as the Salaries
// expense line this report is meant to back up (see lib/office-ledger.ts):
// a draft isn't a real commitment yet, so it stays out of the total sent
// to the GM.
export async function getSalaryReport(monthKey: string): Promise<SalaryReport> {
  const slips = await db
    .select()
    .from(salarySlips)
    .where(and(eq(salarySlips.payMonth, monthKey), eq(salarySlips.status, "paid")));

  const rows: SalaryReportRow[] = [];
  for (const s of slips) {
    const items = await db.select().from(salarySlipItems).where(eq(salarySlipItems.slipId, s.id));
    const totals = calcSalarySlipTotals(
      items.map((i) => ({ type: i.type as "earning" | "deduction", description: i.description, amount: Number(i.amount) }))
    );
    rows.push({
      slipId: s.id,
      slipNo: s.slipNo,
      employeeName: s.employeeName,
      designation: s.designation ?? "",
      earningsTotal: totals.earningsTotal,
      deductionsTotal: totals.deductionsTotal,
      netPay: totals.netPay,
    });
  }

  rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const totals = rows.reduce(
    (acc, r) => ({
      earningsTotal: acc.earningsTotal + r.earningsTotal,
      deductionsTotal: acc.deductionsTotal + r.deductionsTotal,
      netPay: acc.netPay + r.netPay,
    }),
    { earningsTotal: 0, deductionsTotal: 0, netPay: 0 }
  );

  return { monthKey, rows, totals };
}
