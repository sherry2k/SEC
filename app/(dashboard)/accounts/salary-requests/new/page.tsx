import { and, eq, ne, asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import SalaryRequestForm from "@/components/SalaryRequestForm";
import { defaultSalaryRequestValues } from "@/lib/salary-request-defaults";
import BackButton from "@/components/BackButton";

export default async function NewSalaryRequestPage() {
  await requirePermission("accounts.edit");

  const employees = await db
    .select({ id: users.id, name: users.name, designation: users.designation })
    .from(users)
    .where(and(eq(users.status, "approved"), ne(users.role, "master_admin")))
    .orderBy(asc(users.name));

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New salary request</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        Just the net pay per employee — for the GM to approve before any Salary Slip is made.
      </p>
      <div className="mt-8 max-w-3xl">
        <SalaryRequestForm mode="create" initial={defaultSalaryRequestValues()} employees={employees} />
      </div>
    </div>
  );
}
