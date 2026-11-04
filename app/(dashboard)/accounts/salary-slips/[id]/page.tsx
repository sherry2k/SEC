import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { ArrowLeft, Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { canViewSalarySlip } from "@/lib/salary-slip-access";
import { toFilenameSafe } from "@/lib/pdf-filename";
import SalarySlipPrintView from "@/components/SalarySlipPrintView";
import DeleteSalarySlipButton from "@/components/DeleteSalarySlipButton";
import SalarySlipStatusControl from "@/components/SalarySlipStatusControl";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: salarySlips.slipNo }).from(salarySlips).where(eq(salarySlips.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function SalarySlipViewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") redirect("/login");

  const { id } = await params;
  const [slip] = await db.select().from(salarySlips).where(eq(salarySlips.id, id)).limit(1);
  if (!slip) notFound();
  if (!canViewSalarySlip(user, slip.employeeId, slip.status)) redirect("/unauthorized");

  const items = await db
    .select()
    .from(salarySlipItems)
    .where(eq(salarySlipItems.slipId, id))
    .orderBy(asc(salarySlipItems.sortOrder));

  // Admin/Finance manage the document (edit, delete, change status); an
  // employee viewing their own slip only ever gets the read-only view +
  // download, same as anyone outside Accounts looking at any other
  // document here.
  const canManage = can(user.role, "accounts.edit");
  const backHref = canManage ? "/accounts/salary-slips" : "/my-payslips";
  const backLabel = canManage ? "All salary slips" : "My payslips";

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2">
          {canManage && <SalarySlipStatusControl slipId={slip.id} status={slip.status} />}
          {canManage && (
            <Link
              href={`/accounts/salary-slips/${slip.id}/edit`}
              className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
            >
              <Pencil size={13} />
              Edit
            </Link>
          )}
          {canManage && <DeleteSalarySlipButton slipId={slip.id} redirectTo={backHref} />}
          <a
            href={`/api/salary-slips/${slip.id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
        </div>
      </div>

      <SalarySlipPrintView
        slip={{
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
        }}
      />
    </div>
  );
}
