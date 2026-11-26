"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

// Adds a one-off item to this project's checklist under one specific
// category link — for a requirement specific to this project (and, if
// that category is linked more than once, to this particular instance of
// it), not the standard template every project in that category gets
// automatically.
export default function AddChecklistItemButton({ projectId, categoryLinkId }: { projectId: string; categoryLinkId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) {
      setError("Enter a name first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryLinkId, name: name.trim() }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't add that item.");
        setLoading(false);
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[var(--sec-blue)] hover:underline"
      >
        <Plus size={13} />
        Add item to this category
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name, e.g. Extra site survey"
        autoFocus
        className="min-w-[220px] flex-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
      />
      <button
        onClick={handleAdd}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : "Add"}
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setError("");
        }}
        className="text-xs font-medium text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
      >
        Cancel
      </button>
    </div>
  );
}
