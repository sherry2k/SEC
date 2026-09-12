"use client";

import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Fragment, useState } from "react";
import { calcItemTotals } from "@/lib/quotation-calc";

export type QuotationItemDraft = {
  key: string;
  description: string;
  classification: string;
  feeExclVat: string;
  scopeOfWork: string;
  duration: string;
  note: string;
};

const CLASSIFICATION_SUGGESTIONS = ["Mandatory", "Optional", "If Required", "Optional If Required"];

export function emptyItem(): QuotationItemDraft {
  return {
    key: crypto.randomUUID(),
    description: "",
    classification: "Mandatory",
    feeExclVat: "",
    scopeOfWork: "",
    duration: "",
    note: "",
  };
}

export default function QuotationLineItemsEditor({
  items,
  onChange,
  vatRatePercent,
}: {
  items: QuotationItemDraft[];
  onChange: (items: QuotationItemDraft[]) => void;
  vatRatePercent: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const update = (key: string, patch: Partial<QuotationItemDraft>) => {
    onChange(items.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };
  const remove = (key: string) => onChange(items.filter((i) => i.key !== key));
  const add = () => onChange([...items, emptyItem()]);

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-1 focus:ring-[var(--sec-blue)]/20";

  return (
    <div className="space-y-3">
      <datalist id="classification-suggestions">
        {CLASSIFICATION_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--sec-line)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--sec-muted)]">
              <th className="w-10 px-3 py-2 font-medium">No.</th>
              <th className="px-3 py-2 font-medium">Service</th>
              <th className="w-40 px-3 py-2 font-medium">Classification</th>
              <th className="w-32 px-3 py-2 font-medium">Fee Excl. VAT</th>
              <th className="w-28 px-3 py-2 font-medium">VAT</th>
              <th className="w-32 px-3 py-2 font-medium">Total Incl. VAT</th>
              <th className="w-16 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const fee = Number(item.feeExclVat) || 0;
              const { vatAmount, totalInclVat } = calcItemTotals(fee, vatRatePercent);
              const isExpanded = expanded[item.key];
              return (
                <Fragment key={item.key}>
                  <tr className="border-b border-[var(--sec-line)] align-top">
                    <td className="px-3 py-2 text-[var(--sec-muted)]">{index + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        value={item.description}
                        onChange={(e) => update(item.key, { description: e.target.value })}
                        placeholder="e.g. Building Occupancy Certificate BOC"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--sec-blue)]"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        Scope of work &amp; duration (optional)
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        list="classification-suggestions"
                        value={item.classification}
                        onChange={(e) => update(item.key, { classification: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.feeExclVat}
                        onChange={(e) => update(item.key, { feeExclVat: e.target.value })}
                        placeholder="0.00"
                        className={inputClass}
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
                        onClick={() => remove(item.key)}
                        className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-[var(--sec-line)] bg-slate-50/60">
                      <td />
                      <td colSpan={4} className="px-3 py-3">
                        <label className="mb-1 block text-xs font-medium text-[var(--sec-muted)]">
                          Scope of work (one point per line — shown as a numbered list when printed)
                        </label>
                        <textarea
                          value={item.scopeOfWork}
                          onChange={(e) => update(item.key, { scopeOfWork: e.target.value })}
                          rows={3}
                          placeholder={"Review the available documents and drawings.\nPrepare and submit the application through the applicable platform."}
                          className={inputClass}
                        />
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-[var(--sec-muted)]">Duration</label>
                            <input
                              value={item.duration}
                              onChange={(e) => update(item.key, { duration: e.target.value })}
                              placeholder="e.g. 30 Working Days"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-[var(--sec-muted)]">
                              Note (optional caveat, shown under the scope)
                            </label>
                            <input
                              value={item.note}
                              onChange={(e) => update(item.key, { note: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </td>
                      <td />
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
      >
        <Plus size={14} />
        Add line item
      </button>
    </div>
  );
}
