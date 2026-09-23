import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getQuotationForPrint } from "@/lib/quotation-data";
import QuotationPrintBody from "@/components/QuotationPrintBody";
import QuotationCategoryPrintBody from "@/components/QuotationCategoryPrintBody";
import PrintWatermark from "@/components/PrintWatermark";
import PrintWatermarkFirstPage from "@/components/PrintWatermarkFirstPage";

// Loaded only by the server-side PDF generator (Puppeteer), never linked
// to directly — no letterhead/footer here, since those come from
// Puppeteer's own header/footer templates instead. Still requires the
// same login as the normal view; the PDF route forwards the visitor's
// session cookie when it loads this page.
export default async function QuotationPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const quotation = await getQuotationForPrint(id);
  if (!quotation) notFound();

  return (
    <>
      <PrintWatermark />
      <div className="relative mx-auto max-w-[780px] bg-white px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
        <PrintWatermarkFirstPage />
      {quotation.category ? <QuotationCategoryPrintBody quotation={quotation} /> : <QuotationPrintBody quotation={quotation} />}
    </div>
    </>
  );
}
