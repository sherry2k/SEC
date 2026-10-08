"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Loader2, X, Check } from "lucide-react";
import type { DocumentRenewalRow, ExpiryStatus } from "@/lib/document-renewals";

function statusBadge(status: ExpiryStatus, daysUntil: number) {
  if (status === "expired") {
    return { label: `Expired ${Math.abs(daysUntil)}d ago`, className: "bg-red-50 text-red-700" };
  }
  if (status === "expiring") {
    return { label: `${daysUntil}d left`, className: "bg-amber-50 text-amber-700" };
  }
  return { label: "Valid", className: "bg-emerald-50 text-emerald-700" };
}

function toInputDate(ddmmyyyy: string | null): string {
  if (!ddmmyyyy) return "";
  const [d, m, y] = ddmmyyyy.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m}-${d}`;
}

type FormState = { userId: string; documentType: string; documentNumber: string; issueDate: string; expiryDate: string; notes: string };

function emptyForm(userId: string): FormState {
  return { userId, documentType: "", documentNumber: "", issueDate: "", expiryDate: "", notes: "" };
}

function EntryForm({
  initial,
  typeSuggestions,
  fixedUserId,
  staffOptions,
  onSaved,
  onCancel,
  entryId,
}: {
  initial: FormState;
  typeSuggestions: string[];
  fixedUserId?: string; // if set, userId isn't editable (adding under a specific person)
  staffOptions?: { id: number; name: string }[]; // provided when the user needs to be picked (new staff document)
  onSaved: () => void;
  onCancel: () => void;
  entryId?: string; // set when editing an existing entry
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]";
  const listId = `doc-type-suggestions-${fixedUserId ?? "company"}${entryId ?? ""}`;

  const submit = async () => {
    if (staffOptions && !form.userId) {
      setError("Choose a staff member first.");
      return;
    }
    if (!form.documentType.trim()) {
      setError("Document type is required.");
      return;
    }
    if (!form.expiryDate) {
      setError("Enter a valid expiry date.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = entryId ? `/api/document-renewals/${entryId}` : "/api/document-renewals";
      const method = entryId ? "PATCH" : "POST";
      const resolvedUserId = fixedUserId ? Number(fixedUserId) : staffOptions ? Number(form.userId) : null;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resolvedUserId,
          documentType: form.documentType,
          documentNumber: form.documentNumber,
          issueDate: form.issueDate,
          expiryDate: form.expiryDate,
          notes: form.notes,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save that.");
        return;
      }
      onSaved();
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 rounded-md border border-[var(--sec-line)] bg-slate-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        {staffOptions && (
          <select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className={`${inputClass} col-span-2`}>
            <option value="">Choose staff member</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <div>
          <input
            list={listId}
            value={form.documentType}
            onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
            placeholder="Document type"
            className={inputClass}
          />
          <datalist id={listId}>
            {typeSuggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <input
          value={form.documentNumber}
          onChange={(e) => setForm((f) => ({ ...f, documentNumber: e.target.value }))}
          placeholder="Document number (optional)"
          className={inputClass}
        />
        <div>
          <label className="mb-1 block text-xs text-[var(--sec-muted)]">Issue date</label>
          <input type="date" value={form.issueDate} onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--sec-muted)]">Expiry date</label>
          <input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} className={inputClass} />
        </div>
        <input
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Notes (optional)"
          className={`${inputClass} col-span-2`}
        />
      </div>
      <div className="mt-2 flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-xs text-red-600">{error}</p>}
        <button onClick={onCancel} className="rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}

function EntryRow({ row, typeSuggestions, canEdit }: { row: DocumentRenewalRow; typeSuggestions: string[]; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const badge = statusBadge(row.status, row.daysUntil);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/document-renewals/${row.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (editing) {
    return (
      <div className="border-b border-[var(--sec-line)] px-3 py-2 last:border-0">
        <EntryForm
          entryId={row.id}
          fixedUserId={row.userId ? String(row.userId) : undefined}
          initial={{
            userId: row.userId ? String(row.userId) : "",
            documentType: row.documentType,
            documentNumber: row.documentNumber ?? "",
            issueDate: toInputDate(row.issueDate),
            expiryDate: toInputDate(row.expiryDate),
            notes: row.notes ?? "",
          }}
          typeSuggestions={typeSuggestions}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--sec-line)] px-3 py-2 text-sm last:border-0">
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--sec-ink)]">{row.documentType}</p>
        <p className="text-xs text-[var(--sec-muted)]">
          {row.documentNumber && `${row.documentNumber} · `}
          Expires {row.expiryDate}
          {row.notes && ` · ${row.notes}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
        {canEdit && (
          <>
            <button onClick={() => setEditing(true)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]" aria-label="Edit">
              <Pencil size={13} />
            </button>
            {confirmingDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={handleDelete} disabled={deleting} className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="Confirm delete">
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button onClick={() => setConfirmingDelete(false)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-slate-100" aria-label="Cancel">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmingDelete(true)} className="rounded p-1 text-[var(--sec-muted)] hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                <Trash2 size={13} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AddButton({
  label,
  typeSuggestions,
  fixedUserId,
  staffOptions,
}: {
  label: string;
  typeSuggestions: string[];
  fixedUserId?: string;
  staffOptions?: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs font-medium text-[var(--sec-blue)] hover:underline">
        <Plus size={13} />
        {label}
      </button>
    );
  }
  return (
    <EntryForm
      initial={emptyForm(fixedUserId ?? "")}
      typeSuggestions={typeSuggestions}
      fixedUserId={fixedUserId}
      staffOptions={staffOptions}
      onSaved={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    />
  );
}

export default function DocumentRenewalsClient({
  company,
  staffGroups,
  allStaff,
  canEdit,
  companyTypeSuggestions,
  staffTypeSuggestions,
}: {
  company: DocumentRenewalRow[];
  staffGroups: { userId: number; userName: string; rows: DocumentRenewalRow[] }[];
  allStaff: { id: number; name: string }[];
  canEdit: boolean;
  companyTypeSuggestions: string[];
  staffTypeSuggestions: string[];
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Company documents</h2>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
          {company.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--sec-muted)]">No company documents added yet.</p>
          ) : (
            company.map((row) => <EntryRow key={row.id} row={row} typeSuggestions={companyTypeSuggestions} canEdit={canEdit} />)
          )}
        </div>
        {canEdit && (
          <div className="mt-2">
            <AddButton label="Add company document" typeSuggestions={companyTypeSuggestions} />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Staff documents</h2>
          {canEdit && <AddButton label="Add for a new person" typeSuggestions={staffTypeSuggestions} staffOptions={allStaff} />}
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
          {staffGroups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--sec-muted)]">No staff documents added yet.</p>
          ) : (
            staffGroups.map((group) => (
              <div key={group.userId} className="border-b border-[var(--sec-line)] last:border-0">
                <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-[var(--sec-ink)]">{group.userName}</div>
                {group.rows.map((row) => (
                  <EntryRow key={row.id} row={row} typeSuggestions={staffTypeSuggestions} canEdit={canEdit} />
                ))}
                {canEdit && (
                  <div className="px-3 py-2">
                    <AddButton label={`Add document for ${group.userName}`} typeSuggestions={staffTypeSuggestions} fixedUserId={String(group.userId)} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
