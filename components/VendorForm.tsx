"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export type VendorFormValues = {
  name: string;
  category: string;
  contactInfo: string;
  notes: string;
};

// Suggestions only — category stays free text, same reasoning as the
// quotation EXPENSE_CATEGORY_SUGGESTIONS pattern, since SEC's real vendor
// types aren't a fixed list.
export const VENDOR_CATEGORY_SUGGESTIONS = ["Soil Lab", "Survey Company", "Freelancer", "Subcontractor", "Other"];

export default function VendorForm({
  mode,
  vendorId,
  initial,
}: {
  mode: "create" | "edit";
  vendorId?: string;
  initial: VendorFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<VendorFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.name.trim()) {
      setError("Vendor name is required.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/vendors" : `/api/vendors/${vendorId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { error?: string; vendor?: { id: string } } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save this vendor. Try again.");
        setLoading(false);
        return;
      }

      const destination = mode === "create" ? data.vendor?.id : vendorId;
      router.push(`/accounts/vendors/${destination}`);
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
        <label className={labelClass}>Vendor name *</label>
        <input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="e.g. Al Ain Soil Testing Lab"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Category</label>
        <input
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
          list="vendor-category-suggestions"
          placeholder="e.g. Soil Lab, Survey Company, Freelancer"
          className={inputClass}
        />
        <datalist id="vendor-category-suggestions">
          {VENDOR_CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div>
        <label className={labelClass}>Contact info</label>
        <input
          value={values.contactInfo}
          onChange={(e) => set("contactInfo", e.target.value)}
          placeholder="Phone, email, or contact person"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Anything else worth keeping on file for this vendor"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save vendor" : "Save changes"}
      </button>
    </form>
  );
}
