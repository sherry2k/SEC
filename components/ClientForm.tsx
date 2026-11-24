"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export type ClientFormValues = {
  name: string;
  address: string;
  trn: string;
  contactInfo: string;
  notes: string;
};

export default function ClientForm({
  mode,
  clientId,
  initial,
}: {
  mode: "create" | "edit";
  clientId?: string;
  initial: ClientFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ClientFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.name.trim()) {
      setError("Client name is required.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/clients" : `/api/clients/${clientId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { error?: string; client?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save the client. Try again.");
        setLoading(false);
        return;
      }

      const destinationId = mode === "create" ? data.client?.id : clientId;
      router.push(`/accounts/clients/${destinationId}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div>
        <label className={labelClass}>Client name *</label>
        <input value={values.name} onChange={(e) => set("name", e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Address</label>
        <input value={values.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. Abu Dhabi - UAE" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>TRN</label>
        <input value={values.trn} onChange={(e) => set("trn", e.target.value)} placeholder="Tax Registration Number" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Contact info</label>
        <input value={values.contactInfo} onChange={(e) => set("contactInfo", e.target.value)} placeholder="Phone, email, or both" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea value={values.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save client" : "Save changes"}
      </button>
    </form>
  );
}
