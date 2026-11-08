import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";

export type SalaryReportRow = {
  slipId: string;
  slipNo: string;
  employeeName: string;
  designation: string;
  status: string;
  earningsTotal: number;
  deductionsTotal: number;
  netPay: number;
};

export type SalaryReport = {
  monthKey: string;
  rows: SalaryReportRow[];
  totals: { earningsTotal: number; deductionsTotal: number; netPay: number };
};

// Every slip for the month counts, Draft or Paid — this report is meant
// to go to the GM for approval of the amounts BEFORE anyone is marked
// paid (the Accountant pays once the GM signs off), so filtering to
// "paid" only would make the report empty exactly when it's needed.
// lib/office-ledger.ts still only treats "paid" slips as a real Salaries
// expense — that rule is unchanged and separate from this report.
export async function getSalaryReport(monthKey: string): Promise<SalaryReport> {
  const slips = await db.select().from(salarySlips).where(eq(salarySlips.payMonth, monthKey));

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
      status: s.status,
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
