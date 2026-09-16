import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { db } from "@/db";
import { receiptVouchers, receiptVoucherItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import ReceiptVoucherPrintView from "@/components/ReceiptVoucherPrintView";
import PrintButton from "@/components/PrintButton";
import DeleteReceiptVoucherButton from "@/components/DeleteReceiptVoucherButton";

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

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/receipt-vouchers" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All receipt vouchers
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/receipt-vouchers/${voucher.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteReceiptVoucherButton voucherId={voucher.id} />
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
