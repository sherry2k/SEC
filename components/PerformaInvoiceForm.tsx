"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { emptyItem, type PerformaInvoiceFormValues } from "@/lib/performa-invoice-defaults";
import StampToggle from "@/components/StampToggle";

export default function PerformaInvoiceForm({
  mode,
  invoiceId,
  initial,
  projectOptions,
}: {
  mode: "create" | "edit";
  invoiceId?: string;
  projectOptions: { id: string; label: string }[];
  initial: PerformaInvoiceFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PerformaInvoiceFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof PerformaInvoiceFormValues>(key: K, value: PerformaInvoiceFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const updateItem = (key: string, patch: Partial<(typeof values.items)[number]>) =>
    setValues((prev) => ({ ...prev, items: prev.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));
  const removeItem = (key: string) => setValues((prev) => ({ ...prev, items: prev.items.filter((i) => i.key !== key) }));
  const addItem = () => setValues((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validItems = values.items.filter((i) => i.description.trim() && Number(i.amount) > 0);
    if (!values.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (validItems.length === 0) {
      setError("Add at least one valid line item.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/performa-invoices" : `/api/performa-invoices/${invoiceId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, items: validItems.map((i) => ({ ...i, amount: Number(i.amount) })) }),
      });
      const data: { error?: string; invoice?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save the invoice. Try again.");
        setLoading(false);
        return;
      }

      const destination = mode === "create" ? data.invoice?.id : invoiceId;
      router.push(`/accounts/performa-invoices/${destination}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div>
        <label className={labelClass}>Project</label>
        <select value={values.projectId} onChange={(e) => set("projectId", e.target.value)} className={inputClass}>
          <option value="">Not linked to a project</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Customer Name *</label>
          <input value={values.customerName} onChange={(e) => set("customerName", e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Project</label>
          <input value={values.project} onChange={(e) => set("project", e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Customer Address</label>
          <input value={values.customerAddress} onChange={(e) => set("customerAddress", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Issue date</label>
          <input value={values.issueDate} onChange={(e) => set("issueDate", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>VAT rate %</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.vatRatePercent}
            onChange={(e) => set("vatRatePercent", Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Line items</label>
        <div className="space-y-2">
          {values.items.map((item) => (
            <div key={item.key} className="flex flex-wrap items-start gap-2 rounded-md border border-[var(--sec-line)] p-3">
              <input
                value={item.description}
                onChange={(e) => updateItem(item.key, { description: e.target.value })}
                placeholder="Description"
                className={`${inputClass} min-w-[200px] flex-1`}
              />
              <div className="flex items-center gap-1">
                <span className="text-sm text-[var(--sec-muted)]">AED</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => updateItem(item.key, { amount: e.target.value })}
                  className={`${inputClass} w-32`}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
                aria-label="Remove item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
        >
          <Plus size={13} />
          Add item
        </button>
      </div>

      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="One per line — leave blank if there's nothing to add"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Signatory name</label>
        <input value={values.signatoryName} onChange={(e) => set("signatoryName", e.target.value)} className={inputClass} />
      </div>

      <StampToggle checked={values.showStamp} onChange={(v) => set("showStamp", v)} />

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save invoice" : "Save changes"}
      </button>
    </form>
  );
}
