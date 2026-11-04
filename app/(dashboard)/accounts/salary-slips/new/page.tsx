import { and, eq, ne, asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import SalarySlipForm from "@/components/SalarySlipForm";
import { defaultSalarySlipValues } from "@/lib/salary-slip-defaults";
import BackButton from "@/components/BackButton";

export default async function NewSalarySlipPage() {
  await requirePermission("accounts.edit");

  // Same "approved, not master_admin" filter as getAssignableUsers(), plus
  // designation — pulled fresh here since that helper doesn't select it,
  // and the Salary Slip form pre-fills designation when an employee is picked.
  const employees = await db
    .select({ id: users.id, name: users.name, designation: users.designation })
    .from(users)
    .where(and(eq(users.status, "approved"), ne(users.role, "master_admin")))
    .orderBy(asc(users.name));

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New salary slip</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <SalarySlipForm mode="create" initial={defaultSalarySlipValues()} employees={employees} />
      </div>
    </div>
  );
}
