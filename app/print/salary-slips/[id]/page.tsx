import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canViewSalarySlip } from "@/lib/salary-slip-access";
import { getSalarySlipForPrint } from "@/lib/salary-slip-data";
import SalarySlipPrintBody from "@/components/SalarySlipPrintBody";

export default async function SalarySlipPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") redirect("/login");

  const { id } = await params;
  const [row] = await db
    .select({ employeeId: salarySlips.employeeId, status: salarySlips.status })
    .from(salarySlips)
    .where(eq(salarySlips.id, id))
    .limit(1);
  if (!row) notFound();
  if (!canViewSalarySlip(user, row.employeeId, row.status)) redirect("/unauthorized");

  const slip = await getSalarySlipForPrint(id);
  if (!slip) notFound();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <SalarySlipPrintBody slip={slip} />
    </div>
  );
}
