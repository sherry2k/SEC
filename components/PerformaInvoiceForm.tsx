"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { calcPerformaInvoiceTotals } from "@/lib/performa-invoice-calc";
import { calcItemTotals } from "@/lib/quotation-calc";
import { emptyPIItem, type PerformaInvoiceFormValues, type PerformaInvoiceItemDraft } from "@/lib/performa-invoice-defaults";

export default function PerformaInvoiceForm({
  mode,
  invoiceId,
  initial,
}: {
  mode: "create" | "edit";
  invoiceId?: string;
  initial: PerformaInvoiceFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PerformaInvoiceFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof PerformaInvoiceFormValues>(key: K, value: PerformaInvoiceFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const updateItem = (key: string, patch: Partial<PerformaInvoiceItemDraft>) =>
    set("items", values.items.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const removeItem = (key: string) => set("items", values.items.filter((i) => i.key !== key));
  const addItem = () => set("items", [...values.items, emptyPIItem()]);

  const validItems = values.items.filter((i) => i.description.trim() && Number(i.amount) > 0);
  const totals = calcPerformaInvoiceTotals(
    validItems.map((i) => ({ description: i.description, amount: Number(i.amount) })),
    values.vatRatePercent
  );

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";
  const smallInput =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-1 focus:ring-[var(--sec-blue)]/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (validItems.length === 0) {
      setError("Add at least one line item with a description and an amount.");
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
        setError(data.error || "Couldn't save this invoice. Try again.");
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Date</label>
          <input value={values.issueDate} onChange={(e) => set("issueDate", e.target.value)} placeholder="DD/MM/YYYY" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Customer name *</label>
          <input value={values.customerName} onChange={(e) => set("customerName", e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Project</label>
          <input value={values.project} onChange={(e) => set("project", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Customer address</label>
          <input value={values.customerAddress} onChange={(e) => set("customerAddress", e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={labelClass}>Line items</label>
          <div className="flex items-center gap-2 text-sm text-[var(--sec-muted)]">
            VAT rate
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={values.vatRatePercent}
              onChange={(e) => set("vatRatePercent", Number(e.target.value) || 0)}
              className="w-16 rounded-md border border-[var(--sec-line)] px-2 py-1 text-sm outline-none focus:border-[var(--sec-blue)]"
            />
            %
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="w-28 px-3 py-2 font-medium">Amount</th>
                <th className="w-24 px-3 py-2 font-medium">VAT</th>
                <th className="w-28 px-3 py-2 font-medium">Total Incl. VAT</th>
                <th className="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {values.items.map((item) => {
                const amount = Number(item.amount) || 0;
                const { vatAmount, totalInclVat } = calcItemTotals(amount, values.vatRatePercent);
                return (
                  <tr key={item.key} className="border-b border-[var(--sec-line)] last:border-0">
                    <td className="px-3 py-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.key, { description: e.target.value })}
                        placeholder="e.g. Site Visit – Supervision for 1 Visit Fees."
                        className={smallInput}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateItem(item.key, { amount: e.target.value })}
                        placeholder="0.00"
                        className={smallInput}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--sec-muted)]">
                      {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-[var(--sec-ink)]">
                      {totalInclVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
        >
          <Plus size={14} />
          Add line item
        </button>
      </div>

      {validItems.length > 0 && (
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4 text-sm">
          <div className="flex justify-between text-[var(--sec-muted)]">
            <span>Subtotal</span>
            <span>AED {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[var(--sec-muted)]">
            <span>VAT {values.vatRatePercent}%</span>
            <span>AED {totals.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-[var(--sec-line)] pt-1 font-bold text-[var(--sec-ink)]">
            <span>Total Amount</span>
            <span>AED {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Signatory name</label>
        <input
          value={values.signatoryName}
          onChange={(e) => set("signatoryName", e.target.value)}
          placeholder="e.g. Eng. Mohammad Abu Eisa"
          className={inputClass}
        />
      </div>

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
