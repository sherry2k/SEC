"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ITEM_STATUSES, ITEM_STATUS_LABELS, ITEM_STATUS_STYLES, type ItemStatus } from "@/lib/checklist";

export type ChecklistItem = {
  id: string;
  name: string;
  status: ItemStatus;
  remarks: string | null;
  parentItemId: string | null;
};

export default function ChecklistItemRow({
  item,
  projectId,
  depth,
  canEdit,
}: {
  item: ChecklistItem;
  projectId: string;
  depth: number;
  canEdit: boolean;
}) {
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (next: ItemStatus) => {
    const previous = status;
    setStatus(next); // optimistic
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setStatus(previous);
        setError(data.error || "Couldn't save that.");
      }
    } catch {
      setStatus(previous);
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-[var(--sec-line)] py-2.5 last:border-0"
      style={{ paddingLeft: depth * 20 }}
    >
      <span className={`text-sm ${depth > 0 ? "text-[var(--sec-muted)]" : "text-[var(--sec-ink)]"}`}>
        {depth > 0 && <span className="mr-1.5 text-[var(--sec-line)]">└</span>}
        {item.name}
      </span>

      <div className="flex items-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin text-[var(--sec-muted)]" />}
        {error && <span className="text-xs text-red-600">{error}</span>}
        {canEdit ? (
          <select
            value={status}
            onChange={(e) => handleChange(e.target.value as ItemStatus)}
            disabled={saving}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60 ${ITEM_STATUS_STYLES[status]}`}
          >
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ITEM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        ) : (
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ITEM_STATUS_STYLES[status]}`}>
            {ITEM_STATUS_LABELS[status]}
          </span>
        )}
      </div>
    </div>
  );
}
