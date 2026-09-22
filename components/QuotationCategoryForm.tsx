"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { QuotationFormValues } from "@/lib/quotation-defaults";
import { QUOTATION_CATEGORY_LABELS, type QuotationCategory } from "@/lib/quotation-category-constants";
import QuotationFeeItemsEditor from "@/components/QuotationFeeItemsEditor";
import StampToggle from "@/components/StampToggle";

export default function QuotationCategoryForm({
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

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const scopeFee = Number(values.scopeFeeExclVat) || 0;
  const mandatoryTotal = values.mandatoryFees.reduce((sum, f) => sum + (Number(f.price) || 0), 0);
  const optionalTotal = values.optionalServices.reduce((sum, f) => sum + (Number(f.price) || 0), 0);
  const requiredTotal = scopeFee + mandatoryTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!scopeFee || scopeFee <= 0) {
      setError("Enter a valid Scope of Services fee.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/quotations" : `/api/quotations/${quotationId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          scopeFeeExclVat: scopeFee,
          mandatoryFees: values.mandatoryFees
            .filter((f) => f.name.trim() && Number(f.price) > 0)
            .map((f) => ({ name: f.name, price: Number(f.price), note: f.note })),
          optionalServices: values.optionalServices
            .filter((f) => f.name.trim() && Number(f.price) > 0)
            .map((f) => ({ name: f.name, price: Number(f.price), note: f.note })),
        }),
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

      <div className="flex items-center gap-2 rounded-md border border-[var(--sec-blue)]/25 bg-[var(--sec-blue)]/[0.06] px-3.5 py-2.5 text-sm text-[var(--sec-blue)]">
        <span className="font-semibold">{QUOTATION_CATEGORY_LABELS[values.category as QuotationCategory] ?? values.category}</span>
        <span className="text-[var(--sec-muted)]">quotation — scope, exclusions, and terms are pre-filled from the template.</span>
      </div>

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
            placeholder="e.g. Internal Modification for..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input value={values.location} onChange={(e) => set("location", e.target.value)} className={inputClass} />
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
        <h2 className="text-base font-bold text-[var(--sec-ink)]">1 &nbsp;Scope of Services</h2>
        <label className={`${labelClass} mt-3`}>Scope items (one per line)</label>
        <textarea value={values.scopeItemsText} onChange={(e) => set("scopeItemsText", e.target.value)} rows={6} className={inputClass} />
        <label className={`${labelClass} mt-3`}>Professional Consultancy Fee (excl. VAT)</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--sec-muted)]">AED</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.scopeFeeExclVat}
            onChange={(e) => set("scopeFeeExclVat", e.target.value)}
            className={`${inputClass} max-w-[180px]`}
          />
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-[var(--sec-ink)]">2 &nbsp;Mandatory Authority Fees</h2>
        <p className="mt-1 text-xs text-[var(--sec-muted)]">Adjust prices as needed, or add another fee if this project needs one not listed here.</p>
        <div className="mt-3">
          <QuotationFeeItemsEditor items={values.mandatoryFees} onChange={(items) => set("mandatoryFees", items)} addLabel="Add mandatory fee" />
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-[var(--sec-ink)]">3 &nbsp;Exclusions and Limitations</h2>
        <label className={`${labelClass} mt-3`}>One per line</label>
        <textarea value={values.exclusionsText} onChange={(e) => set("exclusionsText", e.target.value)} rows={6} className={inputClass} />
      </div>

      <div>
        <h2 className="text-base font-bold text-[var(--sec-ink)]">4 &nbsp;Optional Additional Services If Required</h2>
        <p className="mt-1 text-xs text-[var(--sec-muted)]">Adjust prices as needed, or add another optional service if this project needs one.</p>
        <div className="mt-3">
          <QuotationFeeItemsEditor items={values.optionalServices} onChange={(items) => set("optionalServices", items)} addLabel="Add optional service" />
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-[var(--sec-ink)]">5 &nbsp;Commercial Terms</h2>
        <label className={`${labelClass} mt-3`}>One per line</label>
        <textarea value={values.commercialConditions} onChange={(e) => set("commercialConditions", e.target.value)} rows={6} className={inputClass} />
      </div>

      <div className="rounded-md border border-[var(--sec-line)] bg-slate-50 p-4 text-sm">
        <p className="font-bold text-[var(--sec-ink)]">Commercial Summary preview</p>
        <div className="mt-2 flex justify-between">
          <span className="text-[var(--sec-muted)]">Total Required Payments</span>
          <span>AED {requiredTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-[var(--sec-muted)]">Total Optional Services</span>
          <span>AED {optionalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="mt-1 flex justify-between font-bold">
          <span>Potential Total Including All Optional Services</span>
          <span>AED {(requiredTotal + optionalTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div>
        <label className={labelClass}>Acceptance note (shown before Bank Account Details)</label>
        <textarea value={values.acceptanceNote} onChange={(e) => set("acceptanceNote", e.target.value)} rows={2} className={inputClass} />
      </div>

      <StampToggle checked={values.showStamp} onChange={(v) => set("showStamp", v)} />

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
