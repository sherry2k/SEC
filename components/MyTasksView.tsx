"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, Loader2, CheckCircle2 } from "lucide-react";
import type { TaskUrgency } from "@/lib/task-urgency";

export type MyTask = {
  projectId: string;
  projectLabel: string;
  taskName: string;
  dueDate: string | null;
  urgency: TaskUrgency;
};

function greeting(firstName: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  return `Good ${part}, ${firstName}`;
}

// Just the greeting + summary chips now — the flat per-task table was
// dropped: seeing the same project repeated once per open task read as
// clutter rather than a task list. The full detail per task still lives
// on the project's own checklist; this is a summary, not a duplicate view.
export default function MyTasksView({
  tasks,
  completedThisWeekCount,
  currentUserName,
}: {
  tasks: MyTask[];
  completedThisWeekCount: number;
  currentUserName: string;
}) {
  const [greetingText, setGreetingText] = useState<string | null>(null);
  useEffect(() => {
    setGreetingText(greeting(currentUserName.split(" ")[0]));
  }, [currentUserName]);

  const overdueCount = tasks.filter((t) => t.urgency === "overdue").length;
  const dueTodayCount = tasks.filter((t) => t.urgency === "due_today").length;
  const inProgressCount = tasks.filter((t) => t.urgency === "in_progress").length;

  const chips = [
    { label: "Overdue", count: overdueCount, icon: AlertCircle, className: "border-red-200 bg-red-50 text-red-700" },
    { label: "Due Today", count: dueTodayCount, icon: Clock, className: "border-amber-200 bg-amber-50 text-amber-700" },
    { label: "In Progress", count: inProgressCount, icon: Loader2, className: "border-blue-200 bg-blue-50 text-blue-700" },
    {
      label: "Completed Task",
      count: completedThisWeekCount,
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-[var(--sec-ink)]">{greetingText ?? "\u00A0"}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <div key={chip.label} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${chip.className}`}>
              <Icon size={18} />
              <div>
                <p className="text-lg font-bold">{chip.count}</p>
                <p className="text-xs">{chip.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
