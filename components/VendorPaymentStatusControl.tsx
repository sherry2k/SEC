"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { VENDOR_PAYMENT_STATUSES, VENDOR_PAYMENT_STATUS_LABELS, type VendorPaymentStatus } from "@/lib/vendor-payment-status";

const BADGE: Record<VendorPaymentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

// Same select-as-status-toggle pattern as SalarySlipStatusControl —
// marking a payment "Paid" is also what makes it count as a Third-Party
// Expenses expense in Income & Expenses for that month (see
// lib/office-ledger.ts), so this is the one action that changes the books.
export default function VendorPaymentStatusControl({ paymentId, status }: { paymentId: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState<VendorPaymentStatus>(
    (VENDOR_PAYMENT_STATUSES as readonly string[]).includes(status) ? (status as VendorPaymentStatus) : "pending"
  );
  const [loading, setLoading] = useState(false);

  const handleChange = async (next: VendorPaymentStatus) => {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor-payments/${paymentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setCurrent(previous);
      } else {
        router.refresh();
      }
    } catch {
      setCurrent(previous);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={current}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as VendorPaymentStatus)}
        className={`appearance-none rounded-full border px-3 py-1.5 pr-7 text-xs font-semibold outline-none transition-colors disabled:opacity-60 ${BADGE[current]}`}
      >
        {VENDOR_PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {VENDOR_PAYMENT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {loading && <Loader2 size={12} className="pointer-events-none absolute right-2 animate-spin text-[var(--sec-muted)]" />}
    </div>
  );
}
