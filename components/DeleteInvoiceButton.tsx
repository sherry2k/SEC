"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Check } from "lucide-react";

export default function DeleteInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't delete this invoice.");
        setDeleting(false);
        return;
      }
      router.push("/accounts/invoices");
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
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
      className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 size={13} />
      Delete
    </button>
  );
}
