import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getPerformaInvoiceForPrint } from "@/lib/performa-invoice-data";
import PerformaInvoicePrintBody from "@/components/PerformaInvoicePrintBody";
import PrintWatermark from "@/components/PrintWatermark";
import PrintWatermarkFirstPage from "@/components/PrintWatermarkFirstPage";

export default async function PerformaInvoicePrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;
  const invoice = await getPerformaInvoiceForPrint(id);
  if (!invoice) notFound();

  return (
    <>
      <PrintWatermark />
      <div className="relative mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
        <PrintWatermarkFirstPage />
      <PerformaInvoicePrintBody invoice={invoice} />
    </div>
    </>
  );
}
