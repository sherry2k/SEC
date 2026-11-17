"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

type ClientDetails = {
  clientName: string;
  clientAddress: string;
  clientTrn: string;
};

// Edits the Statement of Account's own "Client Details" block — a
// per-document override, same idea as Tax Invoice's own editable
// clientName/clientAddress/clientTrn, so correcting how a client's
// details read on this SOA never touches the project's own record or
// any other document issued against it. Works for both the legacy
// Projects statement (kind="project") and the Account Projects
// statement (kind="account-project"), which PATCH different routes but
// share this same inline form.
export default function StatementClientDetailsEditor({
  kind,
  id,
  initial,
}: {
  kind: "project" | "account-project";
  id: string;
  initial: ClientDetails;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<ClientDetails>(initial);

  const apiPath =
    kind === "project" ? `/api/projects/${id}/statement/client-details` : `/api/account-projects/${id}/statement/client-details`;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save client details.");
        setSaving(false);
        return;
      }
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Couldn't save client details.");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValues(initial);
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--sec-blue)] hover:underline"
      >
        <Pencil size={14} />
        Edit client details
      </button>
    );
  }

  return (
    <div className="max-w-md rounded-md border border-[var(--sec-line)] bg-[var(--sec-surface)] p-4">
      <p className="mb-3 text-sm font-semibold text-[var(--sec-ink)]">Edit client details on this Statement of Account</p>
      <div className="flex flex-col gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--sec-muted)]">Client name</span>
          <input
            type="text"
            value={values.clientName}
            onChange={(e) => setValues((v) => ({ ...v, clientName: e.target.value }))}
            className="w-full rounded border border-[var(--sec-line)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--sec-muted)]">Client address</span>
          <input
            type="text"
            value={values.clientAddress}
            onChange={(e) => setValues((v) => ({ ...v, clientAddress: e.target.value }))}
            className="w-full rounded border border-[var(--sec-line)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--sec-muted)]">Client TRN No.</span>
          <input
            type="text"
            value={values.clientTrn}
            onChange={(e) => setValues((v) => ({ ...v, clientTrn: e.target.value }))}
            className="w-full rounded border border-[var(--sec-line)] px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-[var(--sec-blue)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={handleCancel} disabled={saving} className="text-sm font-medium text-[var(--sec-muted)] hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
