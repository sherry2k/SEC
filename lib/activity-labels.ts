// Client-safe: no "server-only" import here, unlike lib/activity.ts, so
// components like NotificationBell can use these without pulling in
// database code.

export type ActivityAction =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "category_added"
  | "checklist_status_changed"
  | "quotation_created"
  | "quotation_updated"
  | "quotation_deleted";

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  project_created: "created",
  project_updated: "updated",
  project_deleted: "deleted",
  category_added: "linked a category to",
  checklist_status_changed: "updated a checklist item on",
  quotation_created: "created quotation",
  quotation_updated: "updated quotation",
  quotation_deleted: "deleted quotation",
};
