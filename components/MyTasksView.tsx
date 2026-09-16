"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { URGENCY_STYLES, formatDueLabel, type TaskUrgency } from "@/lib/task-urgency";

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

export default function MyTasksView({
  tasks,
  completedThisWeekCount,
  currentUserName,
}: {
  tasks: MyTask[];
  completedThisWeekCount: number;
  currentUserName: string;
}) {
  // Computed client-side (browser's local clock) to avoid a server/client
  // hydration mismatch — the time of day depends on wherever the viewer
  // actually is, not the server's clock.
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
      label: "Completed This Week",
      count: completedThisWeekCount,
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--sec-ink)]">{greetingText ?? "\u00A0"}</h2>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">My Tasks</p>

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

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
        {tasks.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--sec-muted)]">
            No open tasks on your projects right now.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${t.projectId}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                      {t.projectLabel}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-ink)]">
                    <Link href={`/projects/${t.projectId}`} className="hover:underline">
                      {t.taskName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{formatDueLabel(t.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${URGENCY_STYLES[t.urgency]}`} aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
