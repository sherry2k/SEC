export const RECEIPT_VOUCHER_STATUSES = ["draft", "received"] as const;
export type ReceiptVoucherStatus = (typeof RECEIPT_VOUCHER_STATUSES)[number];
export const RECEIPT_VOUCHER_STATUS_LABELS: Record<ReceiptVoucherStatus, string> = {
  draft: "Draft",
  received: "Received",
};
