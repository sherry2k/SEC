import Link from "next/link";
import { Clock } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sec-bg)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sec-blue)]/10">
        <Clock size={24} className="text-[var(--sec-blue)]" />
      </div>
      <h1 className="font-display mt-6 text-2xl text-[var(--sec-ink)]">Waiting for approval</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--sec-muted)]">
        Your account has been created but hasn't been approved yet. An admin needs
        to review your request and assign your role before you can sign in.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-md border border-[var(--sec-line)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
      >
        Back to sign in
      </Link>
    </div>
  );
}
