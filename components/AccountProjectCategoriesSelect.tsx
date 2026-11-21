"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ACCOUNT_PROJECT_CATEGORIES, CATEGORY_LABELS, CATEGORY_BADGE_STYLES, type ProjectCategory } from "@/lib/checklist";

// Inline quick-edit for the list page — lets an existing Account Project's
// categories be changed right from the table row, without opening the full
// edit form. A project can hold more than one category (e.g. both BOC and
// CBC), so this is a checklist dropdown rather than a single <select>.
// Each toggle PATCHes the dedicated categories sub-route with the full
// replacement array (not the full account-project PATCH, which requires a
// client name in the body).
export default function AccountProjectCategoriesSelect({
  accountProjectId,
  initialCategories,
}: {
  accountProjectId: string;
  initialCategories: string[] | null;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>(initialCategories ?? []);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const save = async (next: string[]) => {
    const previous = categories;
    setCategories(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/account-projects/${accountProjectId}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setCategories(previous);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (category: string) => {
    const next = categories.includes(category) ? categories.filter((c) => c !== category) : [...categories, category];
    save(next);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="flex min-w-[140px] flex-wrap items-center gap-1 rounded-md border border-[var(--sec-line)] bg-white px-2 py-1.5 text-left text-xs transition-colors hover:border-[var(--sec-blue)] disabled:opacity-60"
      >
        {categories.length === 0 ? (
          <span className="text-[var(--sec-muted)]">— No category —</span>
        ) : (
          categories.map((c) => (
            <span key={c} className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE_STYLES[c as ProjectCategory]}`}>
              {CATEGORY_LABELS[c as ProjectCategory]}
            </span>
          ))
        )}
        <ChevronDown size={13} className="ml-auto shrink-0 text-[var(--sec-muted)]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-[var(--sec-line)] bg-white p-1.5 shadow-lg">
          {ACCOUNT_PROJECT_CATEGORIES.map((category) => (
            <label key={category} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-slate-50">
              <input type="checkbox" checked={categories.includes(category)} onChange={() => toggle(category)} className="accent-[var(--sec-blue)]" />
              {CATEGORY_LABELS[category]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
