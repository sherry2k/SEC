import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { ArrowLeft, Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { receiptVouchers, receiptVoucherItems, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import ReceiptVoucherPrintView from "@/components/ReceiptVoucherPrintView";
import PrintButton from "@/components/PrintButton";
import DeleteReceiptVoucherButton from "@/components/DeleteReceiptVoucherButton";
import ReceiptVoucherStatusControl from "@/components/ReceiptVoucherStatusControl";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: receiptVouchers.voucherNo }).from(receiptVouchers).where(eq(receiptVouchers.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function ReceiptVoucherViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [voucher] = await db.select().from(receiptVouchers).where(eq(receiptVouchers.id, id)).limit(1);
  if (!voucher) notFound();

  const items = await db
    .select()
    .from(receiptVoucherItems)
    .where(eq(receiptVoucherItems.voucherId, id))
    .orderBy(asc(receiptVoucherItems.sortOrder));

  // Back to the Account Project this voucher was created under, if any —
  // otherwise back to the flat receipt vouchers list.
  let accountProject: { id: string; clientName: string } | null = null;
  if (voucher.accountProjectId) {
    const [p] = await db
      .select({ id: accountProjects.id, clientName: accountProjects.clientName })
      .from(accountProjects)
      .where(eq(accountProjects.id, voucher.accountProjectId))
      .limit(1);
    accountProject = p ?? null;
  }
  const backHref = accountProject ? `/accounts/account-projects/${accountProject.id}` : "/accounts/receipt-vouchers";
  const backLabel = accountProject ? `Back to ${accountProject.clientName}` : "All receipt vouchers";

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2">
          <ReceiptVoucherStatusControl voucherId={voucher.id} status={voucher.status} />
          <Link
            href={`/accounts/receipt-vouchers/${voucher.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteReceiptVoucherButton voucherId={voucher.id} redirectTo={backHref} />
          <a
            href={`/api/receipt-vouchers/${voucher.id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <ReceiptVoucherPrintView
        voucher={{
          voucherNo: voucher.voucherNo,
          issueDate: voucher.issueDate,
          toName: voucher.toName ?? "",
          project: voucher.project ?? "",
          location: voucher.location ?? "",
          vatRatePercent: Number(voucher.vatRatePercent),
          signatoryName: voucher.signatoryName ?? "",
          showStamp: voucher.showStamp,
          notes: voucher.notes ?? "",
          items: items.map((i) => ({
            itemDate: i.itemDate ?? "",
            description: i.description,
            amount: Number(i.amount),
          })),
        }}
      />
    </div>
  );
}
