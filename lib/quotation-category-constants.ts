// Plain constants/types only — no "server-only" here, since these need to
// be importable from client components (the category form) as well as
// server code.

export const QUOTATION_CATEGORIES = ["permit", "boc", "cbc", "work_permit"] as const;
export type QuotationCategory = (typeof QUOTATION_CATEGORIES)[number];

export const QUOTATION_CATEGORY_LABELS: Record<QuotationCategory, string> = {
  permit: "Permit",
  boc: "BOC",
  cbc: "CBC",
  work_permit: "Work Permit",
};

export type TemplateFeeItem = { name: string; defaultPrice: number; note: string };
