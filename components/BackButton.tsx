"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Goes back to whatever page actually linked here, instead of a hardcoded
// destination — right whether this page was opened from the receipt
// vouchers list, an Account Project page, or anywhere else that links here.
export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline"
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  );
}
