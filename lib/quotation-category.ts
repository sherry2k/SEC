import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotationCategoryTemplates } from "@/db/schema";
import { type QuotationCategory, type TemplateFeeItem } from "@/lib/quotation-category-constants";

export { QUOTATION_CATEGORIES, QUOTATION_CATEGORY_LABELS, type QuotationCategory, type TemplateFeeItem } from "@/lib/quotation-category-constants";

export type QuotationCategoryTemplate = {
  category: QuotationCategory;
  title: string;
  subtitle: string;
  intro: string;
  scopeItemsText: string;
  defaultScopeFeeExclVat: number;
  mandatoryFeeItems: TemplateFeeItem[];
  exclusionsText: string;
  optionalServiceItems: TemplateFeeItem[];
  commercialTermsText: string;
  acceptanceNote: string;
};

function mapRow(row: typeof quotationCategoryTemplates.$inferSelect): QuotationCategoryTemplate {
  return {
    category: row.category as QuotationCategory,
    title: row.title,
    subtitle: row.subtitle ?? "",
    intro: row.intro ?? "",
    scopeItemsText: row.scopeItemsText ?? "",
    defaultScopeFeeExclVat: row.defaultScopeFeeExclVat ? Number(row.defaultScopeFeeExclVat) : 0,
    mandatoryFeeItems: Array.isArray(row.mandatoryFeeItems) ? (row.mandatoryFeeItems as TemplateFeeItem[]) : [],
    exclusionsText: row.exclusionsText ?? "",
    optionalServiceItems: Array.isArray(row.optionalServiceItems) ? (row.optionalServiceItems as TemplateFeeItem[]) : [],
    commercialTermsText: row.commercialTermsText ?? "",
    acceptanceNote: row.acceptanceNote ?? "",
  };
}

// Which categories actually have a template set up yet — the "New
// Quotation" picker uses this to show BOC/CBC/Work Permit as "not set up
// yet" rather than letting someone pick a category with nothing behind it.
export async function getAvailableQuotationTemplateCategories(): Promise<QuotationCategory[]> {
  const rows = await db.select({ category: quotationCategoryTemplates.category }).from(quotationCategoryTemplates);
  return rows.map((r) => r.category as QuotationCategory);
}

export async function getQuotationCategoryTemplate(category: QuotationCategory): Promise<QuotationCategoryTemplate | null> {
  const [row] = await db
    .select()
    .from(quotationCategoryTemplates)
    .where(eq(quotationCategoryTemplates.category, category))
    .limit(1);
  return row ? mapRow(row) : null;
}
