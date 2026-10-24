"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { QUOTATION_STATUSES, QUOTATION_STATUS_LABELS, type QuotationStatus } from "@/lib/quotation-status";

const STATUS_BADGE_STYLES: Record<QuotationStatus, string> = {
  draft: "border-[var(--sec-line)] text-[var(--sec-muted)]",
  sent: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

// A dedicated status-only endpoint, not the main quotation PATCH route —
// that route expects the full form payload (clientName, category, items,
// etc.) and would null out everything else on a partial { status } body.
export default function QuotationStatusControl({
  quotationId,
  initialStatus,
  canEdit,
}: {
  quotationId: string;
  initialStatus: QuotationStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (next: QuotationStatus) => {
    const previous = status;
    setStatus(next);
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/quotations/${quotationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setStatus(previous);
        setError(data.error || "Couldn't save that.");
        return;
      }
      router.refresh(); // picks up the Fee Breakdown / Total Quoted recalculation
    } catch {
      setStatus(previous);
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[status]}`}>
        {QUOTATION_STATUS_LABELS[status]}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      {saving && <Loader2 size={13} className="no-print animate-spin text-[var(--sec-muted)]" />}
      {error && <span className="no-print text-xs text-red-600">{error}</span>}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as QuotationStatus)}
        disabled={saving}
        className={`no-print rounded-full border px-3 py-1 text-xs font-medium outline-none disabled:opacity-60 ${STATUS_BADGE_STYLES[status]}`}
      >
        {QUOTATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {QUOTATION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {/* Plain badge, print only — the <select> above is hidden from print */}
      <span className={`hidden rounded-full border px-3 py-1 text-xs font-medium print:inline ${STATUS_BADGE_STYLES[status]}`}>
        {QUOTATION_STATUS_LABELS[status]}
      </span>
    </span>
  );
}
