"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";

export default function AddCategoryButton({
  projectId,
  availableCategories,
}: {
  projectId: string;
  availableCategories: ProjectCategory[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProjectCategory | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (availableCategories.length === 0) return null;

  const handleAdd = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selected }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't add that category.");
        setLoading(false);
        return;
      }
      setSelected("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as ProjectCategory)}
        className="rounded-md border border-[var(--sec-line)] bg-white px-3 py-2 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
      >
        <option value="">Link another category…</option>
        {availableCategories.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={!selected || loading}
        className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Add
      </button>
    </div>
  );
}
