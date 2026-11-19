"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { VENDOR_PAYMENT_STATUSES, VENDOR_PAYMENT_STATUS_LABELS, type VendorPaymentStatus } from "@/lib/vendor-payment-status";

export type VendorPaymentFormValues = {
  paymentDate: string;
  amount: string;
  accountProjectId: string; // "" = not linked to a project
  description: string;
  status: VendorPaymentStatus;
};

export default function VendorPaymentForm({
  mode,
  vendorId,
  paymentId,
  initial,
  accountProjects,
}: {
  mode: "create" | "edit";
  vendorId: string;
  paymentId?: string;
  initial: VendorPaymentFormValues;
  accountProjects: { id: string; clientName: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<VendorPaymentFormValues>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof VendorPaymentFormValues>(key: K, value: VendorPaymentFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const inputClass =
    "w-full rounded-md border border-[var(--sec-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--sec-ink)] outline-none transition-colors focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--sec-ink)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.paymentDate.trim()) {
      setError("Payment date is required.");
      return;
    }
    if (!values.amount || Number(values.amount) <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/vendor-payments" : `/api/vendor-payments/${paymentId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, vendorId, amount: Number(values.amount) }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't save this payment. Try again.");
        setLoading(false);
        return;
      }

      router.push(`/accounts/vendors/${vendorId}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Payment date *</label>
          <input value={values.paymentDate} onChange={(e) => set("paymentDate", e.target.value)} placeholder="DD/MM/YYYY" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Amount (AED) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Link to project</label>
          <select value={values.accountProjectId} onChange={(e) => set("accountProjectId", e.target.value)} className={inputClass}>
            <option value="">— Not linked —</option>
            {accountProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={values.status} onChange={(e) => set("status", e.target.value as VendorPaymentStatus)} className={inputClass}>
            {VENDOR_PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VENDOR_PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="What this payment was for"
          className={`${inputClass} resize-y leading-snug`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "create" ? "Save payment" : "Save changes"}
      </button>
    </form>
  );
}
