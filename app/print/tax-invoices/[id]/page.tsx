import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getTaxInvoiceForPrint } from "@/lib/tax-invoice-data";
import TaxInvoicePrintBody from "@/components/TaxInvoicePrintBody";

export default async function TaxInvoicePrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;
  const invoice = await getTaxInvoiceForPrint(id);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-[780px] bg-white px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <TaxInvoicePrintBody invoice={invoice} />
    </div>
  );
}
