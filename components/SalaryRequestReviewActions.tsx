"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";

export default function SalaryRequestReviewActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/salary-requests/${requestId}/approve`, { method: "POST" });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't approve this request.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/salary-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't reject this request.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setLoading(false);
    }
  };

  if (rejecting) {
    return (
      <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4">
        <label className="mb-1.5 block text-sm font-medium text-[var(--sec-ink)]">Reason for rejecting (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. amount for Ahmed looks wrong, please recheck"
          className="w-full rounded-md border border-[var(--sec-line)] bg-white px-3 py-2 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            Confirm reject
          </button>
          <button
            onClick={() => {
              setRejecting(false);
              setError("");
            }}
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
        onClick={handleApprove}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        Approve
      </button>
      <button
        onClick={() => setRejecting(true)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        <X size={13} />
        Reject
      </button>
    </div>
  );
}
