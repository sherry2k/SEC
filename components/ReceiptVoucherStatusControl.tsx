"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RECEIPT_VOUCHER_STATUSES, RECEIPT_VOUCHER_STATUS_LABELS, type ReceiptVoucherStatus } from "@/lib/receipt-voucher-status";

const BADGE: Record<ReceiptVoucherStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  received: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function ReceiptVoucherStatusControl({ voucherId, status }: { voucherId: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState<ReceiptVoucherStatus>(
    (RECEIPT_VOUCHER_STATUSES as readonly string[]).includes(status) ? (status as ReceiptVoucherStatus) : "draft"
  );
  const [loading, setLoading] = useState(false);

  const handleChange = async (next: ReceiptVoucherStatus) => {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/receipt-vouchers/${voucherId}/status`, {
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
        onChange={(e) => handleChange(e.target.value as ReceiptVoucherStatus)}
        className={`appearance-none rounded-full border px-3 py-1.5 pr-7 text-xs font-semibold outline-none transition-colors disabled:opacity-60 ${BADGE[current]}`}
      >
        {RECEIPT_VOUCHER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {RECEIPT_VOUCHER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {loading && <Loader2 size={12} className="pointer-events-none absolute right-2 animate-spin text-[var(--sec-muted)]" />}
    </div>
  );
}
