"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// A hardcoded Link back to a list page always lands on the unfiltered
// list, no matter what filter or page the person actually came from.
// router.back() returns to wherever they genuinely navigated from —
// a filtered/paginated list, a search, anywhere — since it's real browser
// history, not a fixed destination.
export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sec-blue)] hover:underline"
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  );
}
