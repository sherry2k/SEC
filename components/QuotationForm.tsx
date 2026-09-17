"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import QuotationLineItemsEditor from "@/components/QuotationLineItemsEditor";
import { calcGrandTotals, groupByClassification } from "@/lib/quotation-calc";
import { amountToWordsAED } from "@/lib/number-to-words";
import type { QuotationFormValues } from "@/lib/quotation-defaults";
import StampToggle from "@/components/StampToggle";

export type { QuotationFormValues };

export default function QuotationForm({
  mode,
  quotationId,
  initial,
  projectOptions,
}: {
  mode: "create" | "edit";
  quotationId?: string;
  projectOptions: { id: string; label: string }[];
  initial: QuotationFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<QuotationFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof QuotationFormValues>(key: K, value: QuotationFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const validItems = values.items.filter((i) => i.description.trim() && Number(i.feeExclVat) > 0);
  const totals = calcGrandTotals(
    validItems.map((i) => ({ ...i, feeExclVat: Number(i.feeExclVat) || 0 })),
    values.vatRatePercent
  );
  const groups = groupByClassification(
    validItems.map((i) => ({ ...i, feeExclVat: Number(i.feeExclVat) || 0 })),
    values.vatRatePercent
  );

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (validItems.length === 0) {
      setError("Add at least one line item with a description and a fee.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/quotations" : `/api/quotations/${quotationId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, items: validItems.map((i) => ({ ...i, feeExclVat: Number(i.feeExclVat) })) }),
      });
      const data: { error?: string; quotation?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save the quotation. Try again.");
        setLoading(false);
        return;
      }

      const destination = mode === "create" ? data.quotation?.id : quotationId;
      router.push(`/accounts/quotations/${destination}`);
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
        <select
          value={values.projectId}
          onChange={(e) => set("projectId", e.target.value)}
          className={inputClass}
        >
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
          <label className={labelClass}>Document title</label>
          <input value={values.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Subtitle</label>
          <input
            value={values.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="e.g. Building Occupancy Certificate and Related Consultancy Services"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Attention</label>
          <input value={values.attention} onChange={(e) => set("attention", e.target.value)} placeholder="e.g. Mr. Hassan" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Client *</label>
          <input value={values.clientName} onChange={(e) => set("clientName", e.target.value)} required className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Project</label>
          <input
            value={values.projectDescription}
            onChange={(e) => set("projectDescription", e.target.value)}
            placeholder="e.g. Obtaining Building Occupancy Certificate BOC for..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input value={values.location} onChange={(e) => set("location", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Building configuration</label>
          <input
            value={values.buildingConfig}
            onChange={(e) => set("buildingConfig", e.target.value)}
            placeholder="e.g. Approximately 19 Floors"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Introduction paragraph</label>
        <textarea value={values.intro} onChange={(e) => set("intro", e.target.value)} rows={3} className={inputClass} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={labelClass}>Pricing schedule</label>
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
        <QuotationLineItemsEditor items={values.items} onChange={(items) => set("items", items)} vatRatePercent={values.vatRatePercent} />
      </div>

      {validItems.length > 0 && (
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-sm font-bold text-[var(--sec-ink)]">Financial summary (live preview)</p>
          <div className="mt-2 space-y-1 text-sm">
            {groups.length > 1 &&
              groups.map((g) => (
                <div key={g.label} className="flex justify-between text-[var(--sec-muted)]">
                  <span>{g.label}</span>
                  <span>AED {g.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            <div className="flex justify-between border-t border-[var(--sec-line)] pt-1 font-bold text-[var(--sec-ink)]">
              <span>Grand Total (incl. VAT)</span>
              <span>AED {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <p className="mt-2 text-xs italic text-[var(--sec-muted)]">{amountToWordsAED(totals.grandTotal)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Payment terms (one per line)</label>
          <textarea value={values.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} rows={3} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Commercial conditions (one per line)</label>
          <textarea
            value={values.commercialConditions}
            onChange={(e) => set("commercialConditions", e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Signatory name</label>
          <input value={values.signatoryName} onChange={(e) => set("signatoryName", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Signatory title</label>
          <input value={values.signatoryTitle} onChange={(e) => set("signatoryTitle", e.target.value)} className={inputClass} />
        </div>
      </div>

      <StampToggle checked={values.showStamp} onChange={(v) => set("showStamp", v)} />
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Anything specific to this quotation — one point per line"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save quotation" : "Save changes"}
      </button>
    </form>
  );
}
