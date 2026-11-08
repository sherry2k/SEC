import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc, inArray } from "drizzle-orm";
import { ArrowLeft, Pencil, Download, FileText } from "lucide-react";
import { db } from "@/db";
import { salaryRequests, salaryRequestItems, salarySlips } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import { payMonthLabel } from "@/components/SalarySlipPrintBody";
import SalaryRequestPrintBody from "@/components/SalaryRequestPrintBody";
import DeleteSalaryRequestButton from "@/components/DeleteSalaryRequestButton";
import GenerateSalarySlipsButton from "@/components/GenerateSalarySlipsButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: salaryRequests.requestNo }).from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function SalaryRequestViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [reqRow] = await db.select().from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!reqRow) notFound();

  const items = await db
    .select()
    .from(salaryRequestItems)
    .where(eq(salaryRequestItems.requestId, id))
    .orderBy(asc(salaryRequestItems.sortOrder));

  const slipIds = items.map((i) => i.generatedSlipId).filter((v): v is string => v !== null);
  const slips = slipIds.length
    ? await db.select({ id: salarySlips.id, slipNo: salarySlips.slipNo }).from(salarySlips).where(inArray(salarySlips.id, slipIds))
    : [];
  const slipById = new Map(slips.map((s) => [s.id, s]));

  const pending = reqRow.status === "pending";

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/accounts/salary-requests" className="flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          <ArrowLeft size={14} />
          All salary requests
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {pending && <GenerateSalarySlipsButton requestId={reqRow.id} />}
          {pending && (
            <Link
              href={`/accounts/salary-requests/${reqRow.id}/edit`}
              className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
            >
              <Pencil size={13} />
              Edit
            </Link>
          )}
          {pending && <DeleteSalaryRequestButton requestId={reqRow.id} />}
          <a
            href={`/api/salary-requests/${reqRow.id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
        </div>
      </div>

      {reqRow.status === "generated" && (
        <div className="no-print mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-medium">Salary Slips generated for {payMonthLabel(reqRow.payMonth)}.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.map((item) => {
              const slip = item.generatedSlipId ? slipById.get(item.generatedSlipId) : undefined;
              if (!slip) return null;
              return (
                <Link
                  key={item.id}
                  href={`/accounts/salary-slips/${slip.id}`}
                  className="flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  <FileText size={12} />
                  {item.employeeName} — {slip.slipNo}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[780px]">
        <SalaryRequestPrintBody
          request={{
            requestNo: reqRow.requestNo,
            payMonth: reqRow.payMonth,
            notes: reqRow.notes ?? "",
            items: items.map((i) => ({ employeeName: i.employeeName, designation: i.designation ?? "", amount: Number(i.amount) })),
          }}
        />
      </div>
    </div>
  );
}
