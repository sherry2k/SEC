"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ProjectCategory } from "@/lib/checklist";

// Which categories show this field, and what it's called for each — the
// underlying column (projectCategories.note) is generic, this is just the
// UI-level decision of where to surface it. Add more categories here later
// without any schema change.
const FIELD_CONFIG: Partial<Record<ProjectCategory, { label: string; placeholder: string }>> = {
  contractor: { label: "Assigned Contractor", placeholder: "Contractor name" },
  archives: { label: "Archive Project No.", placeholder: "Project number" },
};

export default function CategoryNoteField({
  projectId,
  category,
  initialNote,
  canEdit,
}: {
  projectId: string;
  category: ProjectCategory;
  initialNote: string | null;
  canEdit: boolean;
}) {
  const config = FIELD_CONFIG[category];
  const [value, setValue] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!config) return null;

  const save = async () => {
    if (value === (initialNote ?? "")) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, note: value }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    if (!value) return null;
    return (
      <p className="px-4 pb-2 text-xs text-[var(--sec-muted)]">
        {config.label}: <span className="text-[var(--sec-ink)]">{value}</span>
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 pb-2">
      <label className="shrink-0 text-xs text-[var(--sec-muted)]">{config.label}:</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        placeholder={config.placeholder}
        className="w-full max-w-xs rounded-md border border-[var(--sec-line)] bg-white px-2 py-1 text-xs text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
      />
      {saving && <Loader2 size={12} className="animate-spin text-[var(--sec-muted)]" />}
    </div>
  );
}
