import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getQuotationForPrint } from "@/lib/quotation-data";
import QuotationPrintBody from "@/components/QuotationPrintBody";

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
    <div className="mx-auto max-w-[780px] bg-white px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      {/* The app's own globals.css sets a @page margin meant for the
          browser's native print flow — this page is loaded by the
          server-side PDF generator instead, which sets its own margin
          directly on page.pdf(). Without this override, both were
          fighting over the page box, which is what caused the header to
          overlap the content instead of just needing a bigger margin. */}
      <style>{`@page { margin: 0; }`}</style>
      <QuotationPrintBody quotation={quotation} />
    </div>
  );
}
