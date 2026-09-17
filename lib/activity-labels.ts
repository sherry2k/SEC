// Client-safe: no "server-only" import here, unlike lib/activity.ts, so
// components like NotificationBell can use these without pulling in
// database code.

export type ActivityAction =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "category_added"
  | "category_removed"
  | "checklist_status_changed"
  | "checklist_item_added"
  | "quotation_created"
  | "quotation_updated"
  | "quotation_deleted"
  | "performa_invoice_created"
  | "performa_invoice_updated"
  | "performa_invoice_deleted"
  | "tax_invoice_created"
  | "tax_invoice_updated"
  | "tax_invoice_deleted"
  | "receipt_voucher_created"
  | "receipt_voucher_updated"
  | "receipt_voucher_deleted"
  | "invoice_created"
  | "invoice_updated"
  | "invoice_deleted"
  | "attachment_added"
  | "attachment_removed";

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  project_created: "created",
  project_updated: "updated",
  project_deleted: "deleted",
  category_added: "linked a category to",
  category_removed: "removed a category from",
  checklist_status_changed: "updated a checklist item on",
  checklist_item_added: "added a checklist item to",
  quotation_created: "created quotation",
  quotation_updated: "updated quotation",
  quotation_deleted: "deleted quotation",
  performa_invoice_created: "created performa invoice",
  performa_invoice_updated: "updated performa invoice",
  performa_invoice_deleted: "deleted performa invoice",
  tax_invoice_created: "created tax invoice",
  tax_invoice_updated: "updated tax invoice",
  tax_invoice_deleted: "deleted tax invoice",
  receipt_voucher_created: "created receipt voucher",
  receipt_voucher_updated: "updated receipt voucher",
  receipt_voucher_deleted: "deleted receipt voucher",
  invoice_created: "created invoice",
  invoice_updated: "updated invoice",
  invoice_deleted: "deleted invoice",
  attachment_added: "added an attachment to",
  attachment_removed: "removed an attachment from",
};
