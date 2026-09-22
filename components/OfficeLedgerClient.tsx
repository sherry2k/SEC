"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import type { LedgerRow } from "@/lib/office-ledger";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function EntryForm({
  type,
  categorySuggestions,
  onAdded,
}: {
  type: "income" | "expense";
  categorySuggestions: string[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]";

  const submit = async () => {
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }
    if (!Number(amount) || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/office-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, date, category, description, amount: Number(amount) }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save that entry.");
        return;
      }
      setCategory("");
      setDescription("");
      setAmount("");
      setOpen(false);
      onAdded();
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
      >
        <Plus size={13} />
        Add {type === "income" ? "income" : "expense"}
      </button>
    );
  }

  const listId = `${type}-category-suggestions`;

  return (
    <div className="mt-2 rounded-md border border-[var(--sec-line)] bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--sec-ink)]">New {type === "income" ? "income" : "expense"} entry</p>
        <button onClick={() => setOpen(false)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-slate-200" aria-label="Close">
          <X size={13} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        <div>
          <input
            list={listId}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className={inputClass}
          />
          <datalist id={listId}>
            {categorySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className={`${inputClass} col-span-2`}
        />
        <div className="col-span-2 flex items-center gap-2">
          <span className="text-sm text-[var(--sec-muted)]">AED</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} max-w-[140px]`}
          />
          <button
            onClick={submit}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function LedgerRowItem({ row, canDelete }: { row: LedgerRow; canDelete: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/office-ledger/${row.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--sec-line)] px-3 py-2 text-sm last:border-0">
      <div className="min-w-0">
        <p className="truncate text-[var(--sec-ink)]">
          {row.category}
          {row.description && <span className="text-[var(--sec-muted)]"> — {row.description}</span>}
        </p>
        <p className="text-xs text-[var(--sec-muted)]">
          {row.dateLabel}
          {row.createdByName && ` · ${row.createdByName}`}
          {row.source === "receipt_voucher" && " · Receipt Voucher"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-medium text-[var(--sec-ink)]">AED {money(row.amount)}</span>
        {canDelete &&
          row.source === "manual" &&
          (confirming ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete} disabled={deleting} className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="Confirm delete">
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
              <button onClick={() => setConfirming(false)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-slate-100" aria-label="Cancel">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600" aria-label="Delete entry">
              <Trash2 size={13} />
            </button>
          ))}
      </div>
    </div>
  );
}

export default function OfficeLedgerClient({
  incomeRows,
  expenseRows,
  expenseByCategory,
  canEdit,
  expenseCategorySuggestions,
  incomeCategorySuggestions,
}: {
  incomeRows: LedgerRow[];
  expenseRows: LedgerRow[];
  expenseByCategory: { category: string; amount: number }[];
  canEdit: boolean;
  expenseCategorySuggestions: string[];
  incomeCategorySuggestions: string[];
}) {
  const router = useRouter();

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Expenses by category</h2>
          {canEdit && <EntryForm type="expense" categorySuggestions={expenseCategorySuggestions} onAdded={() => router.refresh()} />}
        </div>
        {expenseByCategory.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
            {expenseByCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between border-b border-[var(--sec-line)] px-3 py-2 text-sm last:border-0">
                <span className="text-[var(--sec-ink)]">{c.category}</span>
                <span className="font-medium text-[var(--sec-ink)]">AED {money(c.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Expense entries</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
          {expenseRows.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--sec-muted)]">No expenses logged this month.</p>
          ) : (
            expenseRows.map((row) => <LedgerRowItem key={row.id} row={row} canDelete={canEdit} />)
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Income entries</h2>
          {canEdit && <EntryForm type="income" categorySuggestions={incomeCategorySuggestions} onAdded={() => router.refresh()} />}
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
          {incomeRows.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--sec-muted)]">No income logged this month.</p>
          ) : (
            incomeRows.map((row) => <LedgerRowItem key={row.id} row={row} canDelete={canEdit} />)
          )}
        </div>
      </div>
    </div>
  );
}
