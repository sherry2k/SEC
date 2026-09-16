"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/checklist";

const STATUS_BADGE_STYLES: Record<ProjectStatus, string> = {
  active: "border-[var(--sec-line)] text-[var(--sec-muted)]",
  on_hold: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default function ProjectStatusControl({
  projectId,
  initialStatus,
  canEdit,
}: {
  projectId: string;
  initialStatus: ProjectStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (next: ProjectStatus) => {
    const previous = status;
    setStatus(next);
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setStatus(previous);
        setError(data.error || "Couldn't save that.");
        return;
      }
      router.refresh(); // picks up the new Completed by / on line
    } catch {
      setStatus(previous);
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[status]}`}>
        {PROJECT_STATUS_LABELS[status]}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      {saving && <Loader2 size={13} className="animate-spin text-[var(--sec-muted)]" />}
      {error && <span className="text-xs text-red-600">{error}</span>}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as ProjectStatus)}
        disabled={saving}
        className={`rounded-full border px-3 py-1 text-xs font-medium outline-none disabled:opacity-60 ${STATUS_BADGE_STYLES[status]}`}
      >
        {PROJECT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PROJECT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </span>
  );
}
