import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { quotations, quotationItems, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import QuotationForm from "@/components/QuotationForm";
import QuotationCategoryForm from "@/components/QuotationCategoryForm";
import type { QuotationFormValues, QuotationItemDraft, FeeItemDraft } from "@/lib/quotation-defaults";
import { QUOTATION_CATEGORY_LABELS, type QuotationCategory } from "@/lib/quotation-category";

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

  let accountProject: { id: string; clientName: string; location: string | null } | null = null;
  if (quotation.accountProjectId) {
    const [row] = await db
      .select({ id: accountProjects.id, clientName: accountProjects.clientName, location: accountProjects.location })
      .from(accountProjects)
      .where(eq(accountProjects.id, quotation.accountProjectId))
      .limit(1);
    accountProject = row ?? null;
  }

  const toFeeDraft = (i: (typeof items)[number]): FeeItemDraft => ({
    key: i.id,
    name: i.description,
    price: i.feeExclVat,
    note: i.note ?? "",
  });

  const initial: QuotationFormValues = {
    accountProjectId: quotation.accountProjectId ?? "",
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
    items: items
      .filter((i) => !i.section)
      .map(
        (i): QuotationItemDraft => ({
          key: i.id,
          description: i.description,
          classification: i.classification ?? "",
          feeExclVat: i.feeExclVat,
          scopeOfWork: i.scopeOfWork ?? "",
          duration: i.duration ?? "",
        })
      ),
    category: quotation.category ?? "",
    scopeItemsText: quotation.scopeItemsText ?? "",
    scopeFeeExclVat: quotation.scopeFeeExclVat ?? "",
    exclusionsText: quotation.exclusionsText ?? "",
    acceptanceNote: quotation.acceptanceNote ?? "",
    mandatoryFees: items.filter((i) => i.section === "mandatory").map(toFeeDraft),
    optionalServices: items.filter((i) => i.section === "optional").map(toFeeDraft),
    showCommercialSummary: quotation.showCommercialSummary,
  };

  const backHref = accountProject ? `/accounts/account-projects/${accountProject.id}` : "/accounts/quotations";

  return (
    <div>
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        {accountProject ? "Back to project" : "Back to Quotations"}
      </Link>

      {accountProject && (
        <div className="mb-4 rounded-md border border-[var(--sec-blue)]/25 bg-[var(--sec-blue)]/[0.06] px-3.5 py-2.5 text-sm">
          <span className="font-semibold text-[var(--sec-blue)]">{accountProject.clientName}</span>
          {accountProject.location && <span className="text-[var(--sec-muted)]"> · {accountProject.location}</span>}
        </div>
      )}

      <p className="font-mono text-xs text-[var(--sec-muted)]">
        {quotation.quotationNo}
        {quotation.category && ` · ${QUOTATION_CATEGORY_LABELS[quotation.category as QuotationCategory] ?? quotation.category}`}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit quotation</h1>
      <div className="mt-8 max-w-4xl">
        {quotation.category ? (
          <QuotationCategoryForm mode="edit" quotationId={quotation.id} initial={initial} />
        ) : (
          <QuotationForm mode="edit" quotationId={quotation.id} initial={initial} />
        )}
      </div>
    </div>
  );
}
