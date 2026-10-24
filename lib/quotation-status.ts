// A quotation's lifecycle, separate from its content — same pattern as
// PROJECT_STATUSES in lib/checklist.ts. "accepted" is the literal that
// lib/account-project-finance.ts filters on for Fee Breakdown / Total
// Quoted, so don't rename it without updating that filter too.
export const QUOTATION_STATUSES = ["draft", "sent", "accepted", "rejected"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
};
