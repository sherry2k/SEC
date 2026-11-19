export const VENDOR_PAYMENT_STATUSES = ["pending", "paid"] as const;
export type VendorPaymentStatus = (typeof VENDOR_PAYMENT_STATUSES)[number];
export const VENDOR_PAYMENT_STATUS_LABELS: Record<VendorPaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
};
