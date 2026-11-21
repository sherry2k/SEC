"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_PROJECT_CATEGORIES, CATEGORY_LABELS, CATEGORY_BADGE_STYLES, type ProjectCategory } from "@/lib/checklist";

// Inline quick-edit for the list page — lets an existing Account Project's
// category be changed right from the table row, without opening the full
// edit form. PATCHes the dedicated category sub-route (not the full
// account-project PATCH, which requires a client name in the body).
export default function AccountProjectCategorySelect({
  accountProjectId,
  initialCategory,
}: {
  accountProjectId: string;
  initialCategory: string | null;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory ?? "");
  const [saving, setSaving] = useState(false);

  const badgeClass = category
    ? CATEGORY_BADGE_STYLES[category as ProjectCategory]
    : "border-[var(--sec-line)] bg-white text-[var(--sec-muted)]";

  const handleChange = async (next: string) => {
    const previous = category;
    setCategory(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/account-projects/${accountProjectId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setCategory(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={category}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none transition-colors disabled:opacity-60 ${badgeClass}`}
    >
      <option value="">— No category —</option>
      {ACCOUNT_PROJECT_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {CATEGORY_LABELS[c]}
        </option>
      ))}
    </select>
  );
}
