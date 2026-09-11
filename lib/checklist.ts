// The five project categories and their checklist statuses.
// This mirrors Section 3 of the framework document.

export const PROJECT_CATEGORIES = ["boc", "cbc", "permit", "work_permit", "contractor"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  boc: "BOC",
  cbc: "CBC",
  permit: "Permit",
  work_permit: "Work Permit",
  contractor: "Contractor",
};

export const CATEGORY_FULL_NAMES: Record<ProjectCategory, string> = {
  boc: "Building Occupancy Certificate",
  cbc: "Certificate of Building Condition",
  permit: "Permit",
  work_permit: "Work Permit",
  contractor: "Contractor",
};

export const ITEM_STATUSES = [
  "not_started",
  "in_preparation",
  "submitted",
  "resubmission",
  "approved",
  "rejected",
  "not_applicable",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  not_started: "Not started",
  in_preparation: "In preparation",
  submitted: "Submitted",
  resubmission: "Resubmission",
  approved: "Approved",
  rejected: "Rejected",
  not_applicable: "N/A",
};

export const ITEM_STATUS_STYLES: Record<ItemStatus, string> = {
  not_started: "bg-slate-100 text-slate-600 border-slate-200",
  in_preparation: "bg-blue-50 text-blue-700 border-blue-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  resubmission: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  not_applicable: "bg-slate-50 text-slate-400 border-slate-200",
};

export const PROJECT_STATUSES = ["active", "on_hold", "completed", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};
