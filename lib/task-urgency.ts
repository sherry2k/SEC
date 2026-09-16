// Pure, client-safe logic — shared between the checklist row (small dot)
// and the My Tasks view (stat chips + task list), so the two never
// disagree about what counts as overdue.
import type { ItemStatus } from "@/lib/checklist";

export type TaskUrgency = "overdue" | "due_today" | "in_progress";

export const URGENCY_STYLES: Record<TaskUrgency, string> = {
  overdue: "bg-red-500",
  due_today: "bg-amber-500",
  in_progress: "bg-blue-500",
};

export const URGENCY_LABELS: Record<TaskUrgency, string> = {
  overdue: "Overdue",
  due_today: "Due today",
  in_progress: "In progress",
};

// null return means "not an open task" — already approved or not applicable.
export function classifyTask(dueDate: Date | string | null, status: ItemStatus): TaskUrgency | null {
  if (status === "approved" || status === "not_applicable") return null;
  if (!dueDate) return "in_progress";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "due_today";
  return "in_progress";
}

export function formatDueLabel(dueDate: Date | string | null): string {
  if (!dueDate) return "No due date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  return due.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function daysInCurrentStatus(updatedAt: Date | string): number {
  const then = new Date(updatedAt);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000)));
}
