"use client";

import { Plus, Trash2 } from "lucide-react";
import { type FeeItemDraft, emptyFeeItem } from "@/lib/quotation-defaults";

export default function QuotationFeeItemsEditor({
  items,
  onChange,
  addLabel,
}: {
  items: FeeItemDraft[];
  onChange: (items: FeeItemDraft[]) => void;
  addLabel: string;
}) {
  const update = (key: string, patch: Partial<FeeItemDraft>) =>
    onChange(items.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const remove = (key: string) => onChange(items.filter((i) => i.key !== key));
  const add = () => onChange([...items, emptyFeeItem()]);

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3 py-2 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]";

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.key} className="flex flex-wrap items-start gap-2 rounded-md border border-[var(--sec-line)] p-3">
            <span className="mt-2 w-5 shrink-0 text-sm text-[var(--sec-muted)]">{index + 1}.</span>
            <div className="min-w-[200px] flex-1 space-y-2">
              <input
                value={item.name}
                onChange={(e) => update(item.key, { name: e.target.value })}
                placeholder="Fee name, e.g. Initial Drawings Approval"
                className={inputClass}
              />
              <input
                value={item.note}
                onChange={(e) => update(item.key, { note: e.target.value })}
                placeholder="Payment trigger, e.g. payable before the initial submission"
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-[var(--sec-muted)]">AED</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(e) => update(item.key, { price: e.target.value })}
                className={`${inputClass} w-32`}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(item.key)}
              className="mt-2 rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600"
              aria-label="Remove item"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
      >
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
  );
}
