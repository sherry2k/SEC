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

// A distinct colour per category, applied everywhere a category shows up —
// list badges, checklist section headers, the new-project checkboxes — so
// the eye can tell BOC from Contractor at a glance without reading the text.
export const CATEGORY_BADGE_STYLES: Record<ProjectCategory, string> = {
  boc: "border-[var(--sec-blue)]/25 bg-[var(--sec-blue)]/[0.08] text-[var(--sec-blue)]",
  cbc: "border-violet-200 bg-violet-50 text-violet-700",
  permit: "border-emerald-200 bg-emerald-50 text-emerald-700",
  work_permit: "border-amber-200 bg-amber-50 text-amber-700",
  contractor: "border-rose-200 bg-rose-50 text-rose-700",
};

// Solid version — background is the full category colour, text is white.
// Used when a category is the "on" state (selected on the new-project
// form); the tinted CATEGORY_BADGE_STYLES above is the "off"/informational
// state used everywhere else (list badges, checklist card accents).
export const CATEGORY_SOLID_STYLES: Record<ProjectCategory, string> = {
  boc: "bg-[var(--sec-blue)] border-[var(--sec-blue)]",
  cbc: "bg-violet-600 border-violet-600",
  permit: "bg-emerald-600 border-emerald-600",
  work_permit: "bg-amber-600 border-amber-600",
  contractor: "bg-rose-600 border-rose-600",
};

export const CATEGORY_ACCENT_BORDER: Record<ProjectCategory, string> = {
  boc: "border-l-[var(--sec-blue)]",
  cbc: "border-l-violet-400",
  permit: "border-l-emerald-400",
  work_permit: "border-l-amber-400",
  contractor: "border-l-rose-400",
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
  not_applicable: "Not Required",
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
