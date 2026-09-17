import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { receiptVouchers, receiptVoucherItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import ReceiptVoucherForm from "@/components/ReceiptVoucherForm";
import type { ReceiptVoucherFormValues, ReceiptVoucherItemDraft } from "@/lib/receipt-voucher-defaults";
import { getProjectOptions } from "@/lib/project-options";

export default async function EditReceiptVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [voucher] = await db.select().from(receiptVouchers).where(eq(receiptVouchers.id, id)).limit(1);
  if (!voucher) notFound();

  const items = await db
    .select()
    .from(receiptVoucherItems)
    .where(eq(receiptVoucherItems.voucherId, id))
    .orderBy(asc(receiptVoucherItems.sortOrder));

  const projectOptions = await getProjectOptions();

  const initial: ReceiptVoucherFormValues = {
    projectId: voucher.projectId ?? "",
    issueDate: voucher.issueDate,
    toName: voucher.toName ?? "",
    project: voucher.project ?? "",
    location: voucher.location ?? "",
    vatRatePercent: Number(voucher.vatRatePercent),
    signatoryName: voucher.signatoryName ?? "",
    showStamp: voucher.showStamp,
    items: items.map(
      (i): ReceiptVoucherItemDraft => ({
        key: i.id,
        itemDate: i.itemDate ?? "",
        description: i.description,
        amount: i.amount,
      })
    ),
  };

  return (
    <div>
      <p className="font-mono text-xs text-[var(--sec-muted)]">{voucher.voucherNo}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit receipt voucher</h1>
      <div className="mt-8 max-w-3xl">
        <ReceiptVoucherForm mode="edit" voucherId={voucher.id} initial={initial} projectOptions={projectOptions} />
      </div>
    </div>
  );
}
