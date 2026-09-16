"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Check } from "lucide-react";
import type { ProjectCategory } from "@/lib/checklist";

export default function DeleteCategoryButton({ projectId, category }: { projectId: string; category: ProjectCategory }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't remove that category.");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div className="no-print flex items-center gap-1.5">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Confirm
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs font-medium text-[var(--sec-muted)] hover:text-[var(--sec-ink)]">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Remove this category"
      className="no-print rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 size={14} />
    </button>
  );
}
