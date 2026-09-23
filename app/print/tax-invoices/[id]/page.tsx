import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getTaxInvoiceForPrint } from "@/lib/tax-invoice-data";
import TaxInvoicePrintBody from "@/components/TaxInvoicePrintBody";
import PrintWatermarkRepeated from "@/components/PrintWatermarkRepeated";

export default async function TaxInvoicePrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;
  const invoice = await getTaxInvoiceForPrint(id);
  if (!invoice) notFound();

  return (
    <div className="relative mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <PrintWatermarkRepeated />
      <TaxInvoicePrintBody invoice={invoice} />
    </div>
  );
}
