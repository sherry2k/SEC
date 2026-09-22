import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { receiptVouchers } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import { getReceiptVoucherForPrint } from "@/lib/receipt-voucher-data";
import ReceiptVoucherPrintView from "@/components/ReceiptVoucherPrintView";
import PrintButton from "@/components/PrintButton";
import DeleteReceiptVoucherButton from "@/components/DeleteReceiptVoucherButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: receiptVouchers.voucherNo }).from(receiptVouchers).where(eq(receiptVouchers.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function ReceiptVoucherViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const voucher = await getReceiptVoucherForPrint(id);
  if (!voucher) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/receipt-vouchers" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All receipt vouchers
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/receipt-vouchers/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteReceiptVoucherButton voucherId={id} />
          <a
            href={`/api/receipt-vouchers/${id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <ReceiptVoucherPrintView voucher={voucher} />
    </div>
  );
}
