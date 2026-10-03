"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";

export default function ResponsibleControl({
  projectId,
  currentResponsibleId,
  currentResponsibleName,
  assignableUsers,
  canReassign,
}: {
  projectId: string;
  currentResponsibleId: number | null;
  currentResponsibleName: string | null;
  assignableUsers: { id: number; name: string }[];
  canReassign: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(currentResponsibleId ? String(currentResponsibleId) : "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!canReassign) {
    // Same read-only presentation as any other detail field — this
    // component is only mounted at all where Responsible is already
    // shown, so a non-admin just sees the plain text, nothing extra.
    return <>{currentResponsibleName ?? "—"}</>;
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {currentResponsibleName ?? "—"}
        <button onClick={() => setEditing(true)} className="rounded p-0.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]" aria-label="Change responsible">
          <Pencil size={12} />
        </button>
      </span>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/responsible`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsibleId: selected ? Number(selected) : null }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded border border-[var(--sec-line)] bg-white px-1.5 py-0.5 text-sm"
        autoFocus
      >
        <option value="">Unassigned</option>
        {assignableUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <button onClick={save} disabled={saving} className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50" aria-label="Save">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button onClick={() => setEditing(false)} className="rounded p-0.5 text-[var(--sec-muted)] hover:bg-slate-100" aria-label="Cancel">
        <X size={13} />
      </button>
    </span>
  );
}
