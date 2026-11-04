import { notFound } from "next/navigation";
import { and, eq, ne, asc } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips, salarySlipItems, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import SalarySlipForm from "@/components/SalarySlipForm";
import type { SalarySlipFormValues, SalarySlipItemDraft } from "@/lib/salary-slip-defaults";
import BackButton from "@/components/BackButton";

export default async function EditSalarySlipPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [slip] = await db.select().from(salarySlips).where(eq(salarySlips.id, id)).limit(1);
  if (!slip) notFound();

  const items = await db
    .select()
    .from(salarySlipItems)
    .where(eq(salarySlipItems.slipId, id))
    .orderBy(asc(salarySlipItems.sortOrder));

  const employees = await db
    .select({ id: users.id, name: users.name, designation: users.designation })
    .from(users)
    .where(and(eq(users.status, "approved"), ne(users.role, "master_admin")))
    .orderBy(asc(users.name));

  const initial: SalarySlipFormValues = {
    employeeId: slip.employeeId ? String(slip.employeeId) : "",
    employeeName: slip.employeeName,
    designation: slip.designation ?? "",
    payMonth: slip.payMonth,
    issueDate: slip.issueDate,
    signatoryName: slip.signatoryName ?? "",
    showStamp: slip.showStamp,
    notes: slip.notes ?? "",
    items: items.map(
      (i): SalarySlipItemDraft => ({
        key: i.id,
        type: i.type as "earning" | "deduction",
        description: i.description,
        amount: i.amount,
      })
    ),
  };

  return (
    <div>
      <BackButton />
      <p className="font-mono text-xs text-[var(--sec-muted)]">{slip.slipNo}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit salary slip</h1>
      <div className="mt-8 max-w-3xl">
        <SalarySlipForm mode="edit" slipId={slip.id} initial={initial} employees={employees} />
      </div>
    </div>
  );
}
