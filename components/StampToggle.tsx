"use client";

export default function StampToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5">
      <div>
        <p className="text-sm font-medium text-[var(--sec-ink)]">Company stamp</p>
        <p className="text-xs text-[var(--sec-muted)]">Show the stamp under the signatory on the printed document</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[var(--sec-blue)]" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
