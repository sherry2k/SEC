"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export type AccountProjectFormValues = {
  clientName: string;
  location: string;
  projectDetails: string;
};

export default function AccountProjectForm({
  mode,
  accountProjectId,
  initial,
}: {
  mode: "create" | "edit";
  accountProjectId?: string;
  initial: AccountProjectFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<AccountProjectFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof AccountProjectFormValues>(key: K, value: AccountProjectFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

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

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/account-projects" : `/api/account-projects/${accountProjectId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { error?: string; accountProject?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save the project. Try again.");
        setLoading(false);
        return;
      }

      const destination = mode === "create" ? data.accountProject?.id : accountProjectId;
      router.push(`/accounts/account-projects/${destination}`);
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
        <input value={values.clientName} onChange={(e) => set("clientName", e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Location</label>
        <input
          value={values.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="e.g. Al Shabhana, Abu Dhabi"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Project details</label>
        <textarea
          value={values.projectDetails}
          onChange={(e) => set("projectDetails", e.target.value)}
          rows={3}
          placeholder="e.g. Obtaining Building Occupancy Certificate (BOC) for the existing nursery building."
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save project" : "Save changes"}
      </button>
    </form>
  );
}