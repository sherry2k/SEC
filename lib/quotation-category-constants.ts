// Plain constants/types only — no "server-only" here, since these need to
// be importable from client components (the category form) as well as
// server code.

export const QUOTATION_CATEGORIES = ["permit", "boc", "cbc", "work_permit", "legalization"] as const;
export type QuotationCategory = (typeof QUOTATION_CATEGORIES)[number];

export const QUOTATION_CATEGORY_LABELS: Record<QuotationCategory, string> = {
  permit: "Permit",
  boc: "BOC",
  cbc: "CBC",
  work_permit: "Work Permit",
  legalization: "Legalization",
};

// Default wording for the Commercial Summary and Payment Schedule's Down
// Payment / Balance rows, by category — used to pre-fill a new category
// quotation's downPaymentLabel/balanceLabel, and as the fallback for any
// quotation saved before these fields existed (downPaymentLabel/
// balanceLabel null in the DB).
export const DEFAULT_DOWN_PAYMENT_LABEL = "Consultancy Down Payment - Upon Appointment";
export const QUOTATION_CATEGORY_BALANCE_LABELS: Record<QuotationCategory, string> = {
  permit: "Consultancy Balance - Upon Building Permit",
  boc: "2nd Payment after obtaining Building Occupancy Certificate (BOC)",
  cbc: "2nd Payment after issue of Certify Building Condition",
  work_permit: "2nd Payment after issue of Work Permit",
  legalization: "2nd Payment after Legalization is issued",
};

export type TemplateFeeItem = { name: string; defaultPrice: number; note: string };
