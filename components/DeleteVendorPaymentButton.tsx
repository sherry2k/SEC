"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Check } from "lucide-react";

export default function DeleteVendorPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/vendor-payments/${paymentId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={handleDelete} disabled={deleting} className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="Confirm delete">
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        </button>
        <button onClick={() => setConfirming(false)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-slate-100" aria-label="Cancel">
          ×
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
      aria-label="Delete payment"
    >
      <Trash2 size={13} />
    </button>
  );
}
