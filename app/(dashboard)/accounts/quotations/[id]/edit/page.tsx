import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import QuotationForm from "@/components/QuotationForm";
import type { QuotationFormValues, QuotationItemDraft } from "@/lib/quotation-defaults";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
  if (!quotation) notFound();

  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, id))
    .orderBy(asc(quotationItems.sortOrder));

  const initial: QuotationFormValues = {
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
    signatoryName: quotation.signatoryName ?? "",
    signatoryTitle: quotation.signatoryTitle ?? "",
    items: items.map(
      (i): QuotationItemDraft => ({
        key: i.id,
        description: i.description,
        classification: i.classification ?? "",
        feeExclVat: i.feeExclVat,
        scopeOfWork: i.scopeOfWork ?? "",
        duration: i.duration ?? "",
        note: i.note ?? "",
      })
    ),
  };

  return (
    <div>
      <p className="font-mono text-xs text-[var(--sec-muted)]">{quotation.quotationNo}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit quotation</h1>
      <div className="mt-8 max-w-4xl">
        <QuotationForm mode="edit" quotationId={quotation.id} initial={initial} />
      </div>
    </div>
  );
}
