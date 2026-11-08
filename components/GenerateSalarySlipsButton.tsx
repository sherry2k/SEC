"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileCheck2 } from "lucide-react";

export default function GenerateSalarySlipsButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/salary-requests/${requestId}/generate-slips`, { method: "POST" });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't generate salary slips.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <FileCheck2 size={13} />}
          Confirm — create {loading ? "" : "slips"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs font-medium text-[var(--sec-muted)] hover:text-[var(--sec-ink)]">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
    >
      <FileCheck2 size={13} />
      Generate Salary Slips
    </button>
  );
}
