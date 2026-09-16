"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ITEM_STATUSES, ITEM_STATUS_LABELS, ITEM_STATUS_STYLES, type ItemStatus } from "@/lib/checklist";
import { classifyTask, URGENCY_STYLES } from "@/lib/task-urgency";

export type ChecklistItem = {
  id: string;
  name: string;
  status: ItemStatus;
  remarks: string | null;
  parentItemId: string | null;
  dueDate: string | null; // "YYYY-MM-DD" or null
  submittedByName: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ChecklistItemRow({
  item,
  projectId,
  depth,
  canEdit,
  currentUserName,
}: {
  item: ChecklistItem;
  projectId: string;
  depth: number;
  canEdit: boolean;
  currentUserName: string;
}) {
  const [status, setStatus] = useState(item.status);
  const [dueDate, setDueDate] = useState(item.dueDate);
  const [submittedByName, setSubmittedByName] = useState(item.submittedByName);
  const [submittedAt, setSubmittedAt] = useState(item.submittedAt);
  const [approvedAt, setApprovedAt] = useState(item.approvedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (patch: { status?: ItemStatus; dueDate?: string | null }) => {
    const previous = { status, dueDate, submittedByName, submittedAt, approvedAt };

    if (patch.status !== undefined) {
      setStatus(patch.status);
      // Mirror the server's rules here too, so the credit line updates the
      // moment you change status, not just after the next page load.
      // Submitting is the staff action worth crediting; approval is the
      // municipality's call, so it only ever gets a date, never a name.
      if (patch.status === "submitted") {
        setSubmittedByName(currentUserName);
        setSubmittedAt(new Date().toISOString());
      }
      if (patch.status === "approved") {
        setApprovedAt(new Date().toISOString());
      } else if (previous.status === "approved") {
        setApprovedAt(null);
      }
    }
    if (patch.dueDate !== undefined) setDueDate(patch.dueDate);

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setStatus(previous.status);
        setDueDate(previous.dueDate);
        setSubmittedByName(previous.submittedByName);
        setSubmittedAt(previous.submittedAt);
        setApprovedAt(previous.approvedAt);
        setError(data.error || "Couldn't save that.");
      }
    } catch {
      setStatus(previous.status);
      setDueDate(previous.dueDate);
      setSubmittedByName(previous.submittedByName);
      setSubmittedAt(previous.submittedAt);
      setApprovedAt(previous.approvedAt);
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const urgency = classifyTask(dueDate, status);

  let creditLine: string | null = null;
  if (status === "approved" && approvedAt) {
    creditLine = submittedByName
      ? `Submitted by ${submittedByName}${submittedAt ? ` · ${formatDate(submittedAt)}` : ""} — Approved ${formatDate(approvedAt)}`
      : `Approved ${formatDate(approvedAt)}`;
  } else if (submittedByName && submittedAt) {
    creditLine = `Submitted by ${submittedByName} · ${formatDate(submittedAt)}`;
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sec-line)] py-2.5 last:border-0"
      style={{ paddingLeft: depth * 20 }}
    >
      <span className={depth > 0 ? "text-[var(--sec-muted)]" : "text-[var(--sec-ink)]"}>
        <span className="flex items-center gap-2 text-sm">
          {depth > 0 && <span className="text-[var(--sec-line)]">└</span>}
          {urgency && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${URGENCY_STYLES[urgency]}`} aria-hidden="true" />}
          {item.name}
        </span>
        {creditLine && <span className="mt-0.5 block text-xs text-emerald-700">{creditLine}</span>}
      </span>

      <div className="flex items-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin text-[var(--sec-muted)]" />}
        {error && <span className="text-xs text-red-600">{error}</span>}

        {canEdit ? (
          <>
            <span className="text-xs text-[var(--sec-muted)]">Due</span>
            <input
              type="date"
              value={toDateInputValue(dueDate)}
              onChange={(e) => save({ dueDate: e.target.value || null })}
              disabled={saving}
              aria-label={`Due date for ${item.name}`}
              className="rounded-md border border-[var(--sec-line)] px-2 py-1 text-xs text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] disabled:opacity-60"
            />
            <select
              value={status}
              onChange={(e) => save({ status: e.target.value as ItemStatus })}
              disabled={saving}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60 ${ITEM_STATUS_STYLES[status]}`}
            >
              {ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ITEM_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            {dueDate && <span className="text-xs text-[var(--sec-muted)]">Due {toDateInputValue(dueDate)}</span>}
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ITEM_STATUS_STYLES[status]}`}>
              {ITEM_STATUS_LABELS[status]}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
