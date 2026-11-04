import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import type { PrintableSalarySlip } from "@/components/SalarySlipPrintBody";

export async function getSalarySlipForPrint(id: string): Promise<PrintableSalarySlip | null> {
  const [slip] = await db.select().from(salarySlips).where(eq(salarySlips.id, id)).limit(1);
  if (!slip) return null;

  const items = await db
    .select()
    .from(salarySlipItems)
    .where(eq(salarySlipItems.slipId, id))
    .orderBy(asc(salarySlipItems.sortOrder));

  return {
    slipNo: slip.slipNo,
    issueDate: slip.issueDate,
    employeeName: slip.employeeName,
    designation: slip.designation ?? "",
    payMonth: slip.payMonth,
    signatoryName: slip.signatoryName ?? "",
    showStamp: slip.showStamp,
    notes: slip.notes ?? "",
    items: items.map((i) => ({
      type: i.type as "earning" | "deduction",
      description: i.description,
      amount: Number(i.amount),
    })),
  };
}
