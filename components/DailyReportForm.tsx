"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Check } from "lucide-react";

type Entry = { key: string; projectId: string; hours: string };

export default function DailyReportForm({
  initialEntries,
  initialNotes,
  targetHours,
  alreadySubmitted,
  projectOptions,
}: {
  initialEntries: { projectId: string | null; hours: number }[];
  initialNotes: string;
  targetHours: number | null;
  alreadySubmitted: boolean;
  projectOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(
    initialEntries.length > 0
      ? initialEntries.map((e) => ({ key: crypto.randomUUID(), projectId: e.projectId ?? "", hours: String(e.hours) }))
      : [{ key: crypto.randomUUID(), projectId: "", hours: "" }]
  );
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  const updateEntry = (key: string, patch: Partial<Entry>) =>
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const removeEntry = (key: string) => setEntries((prev) => prev.filter((e) => e.key !== key));
  const addEntry = () => setEntries((prev) => [...prev, { key: crypto.randomUUID(), projectId: "", hours: "" }]);

  const total = Math.round(entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0) * 100) / 100;
  const matches = targetHours !== null && Math.abs(total - targetHours) < 0.01;

  const buildPayload = () => ({
    notes,
    entries: entries
      .filter((e) => Number(e.hours) > 0)
      .map((e) => ({ projectId: e.projectId || null, hours: Number(e.hours) })),
  });

  const handleSave = async (submit: boolean) => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/daily-reports/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), submit }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save that.");
        return;
      }
      setSaved(true);
      if (submit) setSubmitted(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]";

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">Time spent per project</p>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <select
              value={entry.projectId}
              onChange={(e) => updateEntry(entry.key, { projectId: e.target.value })}
              className={`${inputClass} flex-1`}
            >
              <option value="">General / office work</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.25"
              value={entry.hours}
              onChange={(e) => updateEntry(entry.key, { hours: e.target.value })}
              placeholder="0"
              className={`${inputClass} w-20 text-right`}
            />
            <span className="text-xs text-[var(--sec-muted)]">h</span>
            <button
              onClick={() => removeEntry(entry.key)}
              className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
              aria-label="Remove entry"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addEntry}
        className="mt-2 flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
      >
        <Plus size={13} />
        Add project
      </button>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--sec-line)] pt-3">
        <span className="text-sm text-[var(--sec-muted)]">Logged so far</span>
        <span className={`text-sm font-semibold ${targetHours === null ? "text-[var(--sec-muted)]" : matches ? "text-emerald-600" : "text-amber-600"}`}>
          {total}h{targetHours !== null && ` of ${targetHours}h`}
        </span>
      </div>
      {targetHours === null && (
        <p className="mt-1 text-xs text-[var(--sec-muted)]">Check out for the day before submitting — hours are matched against your attendance.</p>
      )}

      <div className="mt-6">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">Anything else today</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Site visit to Cavallo Building, met the contractor to review MEP installation"
          className={`${inputClass} w-full`}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="mt-3 flex items-center gap-1 text-sm text-emerald-600">
          <Check size={14} />
          Saved
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="rounded-md border border-[var(--sec-line)] px-4 py-2 text-sm font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)] disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || targetHours === null}
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {submitted ? "Re-submit report" : "Submit report"}
        </button>
        {submitted && <span className="text-xs text-emerald-600">Submitted for today</span>}
      </div>
    </div>
  );
}
