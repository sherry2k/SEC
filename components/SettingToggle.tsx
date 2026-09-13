"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export default function SettingToggle({
  settingKey,
  initialValue,
  label,
  description,
}: {
  settingKey: string;
  initialValue: boolean;
  label: string;
  description: string;
}) {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next); // optimistic
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: String(next) }),
      });
      if (!res.ok) {
        setEnabled(!next); // roll back
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save that. Try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setEnabled(!next);
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-6 rounded-lg border border-[var(--sec-line)] bg-white p-4">
      <div>
        <p className="text-sm font-medium text-[var(--sec-ink)]">{label}</p>
        <p className="mt-0.5 text-sm text-[var(--sec-muted)]">{description}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {saved && (
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
            <Check size={12} /> Saved
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          enabled ? "bg-[var(--sec-blue)]" : "bg-slate-300"
        }`}
      >
        {saving ? (
          <Loader2 size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
        ) : (
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        )}
      </button>
    </div>
  );
}
