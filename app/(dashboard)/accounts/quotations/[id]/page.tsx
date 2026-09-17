import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import QuotationPrintView from "@/components/QuotationPrintView";
import PrintButton from "@/components/PrintButton";
import DeleteQuotationButton from "@/components/DeleteQuotationButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: quotations.quotationNo }).from(quotations).where(eq(quotations.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function QuotationViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
  if (!quotation) notFound();

  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, id))
    .orderBy(asc(quotationItems.sortOrder));

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/quotations" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All quotations
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/quotations/${quotation.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteQuotationButton quotationId={quotation.id} />
          <PrintButton />
        </div>
      </div>

      <QuotationPrintView
        quotation={{
          quotationNo: quotation.quotationNo,
          title: quotation.title,
          subtitle: quotation.subtitle ?? "",
          attention: quotation.attention ?? "",
          clientName: quotation.clientName ?? "",
          projectDescription: quotation.projectDescription ?? "",
          location: quotation.location ?? "",
          buildingConfig: quotation.buildingConfig ?? "",
          vatRatePercent: Number(quotation.vatRatePercent),
          intro: quotation.intro ?? "",
          paymentTerms: quotation.paymentTerms ?? "",
          commercialConditions: quotation.commercialConditions ?? "",
          notes: quotation.notes ?? "",
          signatoryName: quotation.signatoryName ?? "",
          showStamp: quotation.showStamp,
          signatoryTitle: quotation.signatoryTitle ?? "",
          createdAt: quotation.createdAt,
          items: items.map((i) => ({
            description: i.description,
            classification: i.classification ?? "",
            feeExclVat: Number(i.feeExclVat),
            scopeOfWork: i.scopeOfWork ?? "",
            duration: i.duration ?? "",
          })),
        }}
      />
    </div>
  );
}
