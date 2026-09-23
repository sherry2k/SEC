import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getReceiptVoucherForPrint } from "@/lib/receipt-voucher-data";
import ReceiptVoucherPrintBody from "@/components/ReceiptVoucherPrintBody";

export default async function ReceiptVoucherPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;
  const voucher = await getReceiptVoucherForPrint(id);
  if (!voucher) notFound();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <ReceiptVoucherPrintBody voucher={voucher} />
    </div>
  );
}
