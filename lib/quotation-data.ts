import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
import type { PrintableQuotation } from "@/components/QuotationPrintBody";

// Shared between the normal in-app view page and the PDF-source page, so
// both render from exactly the same data mapping.
export async function getQuotationForPrint(id: string): Promise<PrintableQuotation | null> {
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
  if (!quotation) return null;

  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, id))
    .orderBy(asc(quotationItems.sortOrder));

  const flatItems = items.filter((i) => !i.section);
  const mandatoryFees = items.filter((i) => i.section === "mandatory");
  const optionalServices = items.filter((i) => i.section === "optional");

  return {
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
    items: flatItems.map((i) => ({
      description: i.description,
      classification: i.classification ?? "",
      feeExclVat: Number(i.feeExclVat),
      scopeOfWork: i.scopeOfWork ?? "",
      duration: i.duration ?? "",
    })),
    category: quotation.category ?? "",
    scopeItemsText: quotation.scopeItemsText ?? "",
    scopeFeeExclVat: quotation.scopeFeeExclVat ? Number(quotation.scopeFeeExclVat) : 0,
    exclusionsText: quotation.exclusionsText ?? "",
    acceptanceNote: quotation.acceptanceNote ?? "",
    mandatoryFees: mandatoryFees.map((i) => ({ name: i.description, price: Number(i.feeExclVat), note: i.note ?? "" })),
    optionalServices: optionalServices.map((i) => ({ name: i.description, price: Number(i.feeExclVat), note: i.note ?? "" })),
  };
}
