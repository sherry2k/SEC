"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, countWorkingDays, type LeaveType } from "@/lib/leave";

export default function LeaveRequestForm() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewDays = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    return countWorkingDays(startDate, endDate);
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Pick a start and end date.");
      return;
    }
    if (endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, startDate, endDate, reason }),
      });
      const data: { error?: string; request?: { id: string } } = await res.json().catch(() => ({}));
      if (!res.ok || !data.request) {
        setError(data.error || "Couldn't submit that.");
        setSaving(false);
        return;
      }

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch(`/api/leave-requests/${data.request.id}/attachment`, {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) {
          // The request itself was created successfully — only the
          // attachment failed, so don't block on it, just surface it.
          const uploadData: { error?: string } = await uploadRes.json().catch(() => ({}));
          setError(uploadData.error ? `Request submitted, but the attachment failed: ${uploadData.error}` : "Request submitted, but the attachment failed to upload.");
        }
      }

      router.push(`/leave-requests/${data.request.id}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl rounded-lg border border-[var(--sec-line)] bg-white p-5">
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">Leave type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as LeaveType)}
          className="mt-1 w-full rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm outline-none focus:border-[var(--sec-blue)]"
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {LEAVE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm outline-none focus:border-[var(--sec-blue)]"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm outline-none focus:border-[var(--sec-blue)]"
          />
        </div>
      </div>

      {previewDays !== null && (
        <p className="mt-2 text-xs text-[var(--sec-muted)]">
          {previewDays} working {previewDays === 1 ? "day" : "days"} (Mon–Sat).
        </p>
      )}

      <div className="mt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. family travel, medical appointment"
          className="mt-1 w-full rounded-md border border-[var(--sec-line)] px-3 py-2 text-sm outline-none focus:border-[var(--sec-blue)]"
        />
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">
          Supporting document (optional)
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm text-[var(--sec-muted)] file:mr-3 file:rounded-md file:border file:border-[var(--sec-line)] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--sec-ink)] hover:file:border-[var(--sec-blue)]"
        />
        <p className="mt-1 text-xs text-[var(--sec-muted)]">e.g. a medical certificate for sick leave. PDF, JPG or PNG, up to 10MB.</p>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-60"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        Submit request
      </button>
    </form>
  );
}
