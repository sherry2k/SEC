// Client-safe: no "server-only" import here, unlike lib/activity.ts, so
// components like NotificationBell can use these without pulling in
// database code.

export type ActivityAction =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "project_responsible_changed"
  | "category_added"
  | "category_removed"
  | "checklist_status_changed"
  | "checklist_item_added"
  | "account_project_created"
  | "account_project_updated"
  | "account_project_deleted"
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
  | "salary_slip_created"
  | "salary_slip_updated"
  | "salary_slip_deleted"
  | "salary_request_created"
  | "salary_request_updated"
  | "salary_request_deleted"
  | "salary_request_generated"
  | "salary_request_approved"
  | "salary_request_rejected"
  | "attachment_added"
  | "attachment_removed"
  | "leave_request_created"
  | "leave_request_approved"
  | "leave_request_rejected"
  | "leave_request_cancelled"
  | "credential_created"
  | "credential_updated"
  | "credential_deleted";

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  project_created: "created",
  project_updated: "updated",
  project_deleted: "deleted",
  project_responsible_changed: "reassigned the responsible person on",
  category_added: "linked a category to",
  category_removed: "removed a category from",
  checklist_status_changed: "updated a checklist item on",
  checklist_item_added: "added a checklist item to",
  account_project_created: "created account project",
  account_project_updated: "updated account project",
  account_project_deleted: "deleted account project",
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
  salary_slip_created: "created salary slip",
  salary_slip_updated: "updated salary slip",
  salary_slip_deleted: "deleted salary slip",
  salary_request_created: "created salary request",
  salary_request_updated: "updated salary request",
  salary_request_deleted: "deleted salary request",
  salary_request_generated: "generated salary slips from salary request",
  salary_request_approved: "approved salary request",
  salary_request_rejected: "rejected salary request",
  attachment_added: "added an attachment to",
  attachment_removed: "removed an attachment from",
  leave_request_created: "submitted a leave request",
  leave_request_approved: "approved a leave request",
  leave_request_rejected: "rejected a leave request",
  leave_request_cancelled: "cancelled a leave request",
  credential_created: "added a portal credential for",
  credential_updated: "updated the portal credential for",
  credential_deleted: "deleted the portal credential for",
};
