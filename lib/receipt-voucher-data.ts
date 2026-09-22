import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { receiptVouchers, receiptVoucherItems } from "@/db/schema";
import type { PrintableReceiptVoucher } from "@/components/ReceiptVoucherPrintBody";

export async function getReceiptVoucherForPrint(id: string): Promise<PrintableReceiptVoucher | null> {
  const [voucher] = await db.select().from(receiptVouchers).where(eq(receiptVouchers.id, id)).limit(1);
  if (!voucher) return null;

  const items = await db
    .select()
    .from(receiptVoucherItems)
    .where(eq(receiptVoucherItems.voucherId, id))
    .orderBy(asc(receiptVoucherItems.sortOrder));

  return {
    voucherNo: voucher.voucherNo,
    issueDate: voucher.issueDate,
    toName: voucher.toName ?? "",
    project: voucher.project ?? "",
    location: voucher.location ?? "",
    vatRatePercent: Number(voucher.vatRatePercent),
    signatoryName: voucher.signatoryName ?? "",
    showStamp: voucher.showStamp,
    items: items.map((i) => ({
      itemDate: i.itemDate ?? "",
      description: i.description,
      amount: Number(i.amount),
    })),
  };
}
