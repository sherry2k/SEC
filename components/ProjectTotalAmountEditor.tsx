"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";

export default function ProjectTotalAmountEditor({
  projectId,
  initialAmount,
  canEdit,
}: {
  projectId: string;
  initialAmount: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialAmount);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(initialAmount || ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    const value = Number(draft);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: value }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save that.");
        return;
      }
      setAmount(value);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Project Total Amount</p>
        <div className="mt-1 flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            className="w-32 rounded-md border border-[var(--sec-line)] px-2 py-1 text-sm outline-none focus:border-[var(--sec-blue)]"
          />
          <button onClick={save} disabled={saving} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50" aria-label="Save">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setDraft(String(amount || ""));
              setError("");
            }}
            className="rounded-md p-1 text-[var(--sec-muted)] hover:bg-slate-100"
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Project Total Amount</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-lg font-bold text-[var(--sec-ink)]">
        AED {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        {canEdit && (
          <button onClick={() => setEditing(true)} className="rounded p-0.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]" aria-label="Edit total amount">
            <Pencil size={13} />
          </button>
        )}
      </p>
    </div>
  );
}
