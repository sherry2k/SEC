import { notFound, redirect } from "next/navigation";
import { and, eq, ne, asc } from "drizzle-orm";
import { db } from "@/db";
import { salaryRequests, salaryRequestItems, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import SalaryRequestForm from "@/components/SalaryRequestForm";
import type { SalaryRequestFormValues, SalaryRequestItemDraft } from "@/lib/salary-request-defaults";
import BackButton from "@/components/BackButton";

export default async function EditSalaryRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [reqRow] = await db.select().from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!reqRow) notFound();

  // Once slips are generated, each item is linked to its own Salary Slip —
  // editing the amounts here would no longer mean anything, so this mirrors
  // the API-level guard and sends the admin to the (now read-only) view
  // instead of a form that would just fail to save.
  if (reqRow.status === "generated") redirect(`/accounts/salary-requests/${id}`);

  const items = await db
    .select()
    .from(salaryRequestItems)
    .where(eq(salaryRequestItems.requestId, id))
    .orderBy(asc(salaryRequestItems.sortOrder));

  const employees = await db
    .select({ id: users.id, name: users.name, designation: users.designation })
    .from(users)
    .where(and(eq(users.status, "approved"), ne(users.role, "master_admin")))
    .orderBy(asc(users.name));

  const initial: SalaryRequestFormValues = {
    payMonth: reqRow.payMonth,
    notes: reqRow.notes ?? "",
    items: items.map(
      (i): SalaryRequestItemDraft => ({
        key: i.id,
        employeeId: i.employeeId ? String(i.employeeId) : "",
        employeeName: i.employeeName,
        designation: i.designation ?? "",
        amount: i.amount,
      })
    ),
  };

  return (
    <div>
      <BackButton />
      <p className="font-mono text-xs text-[var(--sec-muted)]">{reqRow.requestNo}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit salary request</h1>
      <div className="mt-8 max-w-3xl">
        <SalaryRequestForm mode="edit" requestId={reqRow.id} initial={initial} employees={employees} />
      </div>
    </div>
  );
}
