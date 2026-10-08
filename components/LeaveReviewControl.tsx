"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";

export default function LeaveReviewControl({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const decide = async (status: "approved" | "rejected") => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/leave-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: note }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save that.");
        setSaving(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setSaving(false);
    }
  };

  if (rejecting) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for rejecting (optional)"
          autoFocus
          disabled={saving}
          className="w-56 rounded-md border border-[var(--sec-line)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--sec-blue)]"
        />
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            onClick={() => decide("rejected")}
            disabled={saving}
            className="flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Confirm reject
          </button>
          <button
            onClick={() => setRejecting(false)}
            className="text-xs font-medium text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={() => decide("approved")}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        Approve
      </button>
      <button
        onClick={() => setRejecting(true)}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] hover:border-red-300 hover:bg-red-50 hover:text-red-600"
      >
        <X size={13} />
        Reject
      </button>
    </div>
  );
}
