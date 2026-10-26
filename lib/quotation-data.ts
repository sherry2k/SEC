import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
import type { PrintableQuotation } from "@/components/QuotationPrintBody";

// Category-quotation Intro text can contain the literal token
// "{{SCOPE_FEE}}" instead of a hardcoded amount, so it keeps matching the
// Professional Consultancy Fee even after the fee is edited later — before
// this, the template's intro text baked in a dollar figure at creation
// time with no way to re-sync it, which is exactly what let the "AED
// 18,000.00" overview sentence go stale after the fee was dropped to AED
// 13,000.00 on an already-created quotation.
function substituteScopeFeePlaceholder(text: string, scopeFeeExclVat: number, vatRatePercent: number): string {
  if (!text.includes("{{SCOPE_FEE}}")) return text;
  const formatted = `AED ${scopeFeeExclVat.toLocaleString(undefined, { minimumFractionDigits: 2 })} plus ${vatRatePercent}% VAT`;
  return text.split("{{SCOPE_FEE}}").join(formatted);
}

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
    intro: substituteScopeFeePlaceholder(
      quotation.intro ?? "",
      quotation.scopeFeeExclVat ? Number(quotation.scopeFeeExclVat) : 0,
      Number(quotation.vatRatePercent)
    ),
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
    // Was never mapped before — the toggle saved fine on the quotation
    // row, but getQuotationForPrint() silently dropped it, so the print
    // component always received undefined (falsy) and could never key off
    // the real saved value.
    showCommercialSummary: quotation.showCommercialSummary ?? true,
  };
}
