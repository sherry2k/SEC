import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sec-bg)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert size={24} className="text-red-600" />
      </div>
      <h1 className="font-display mt-6 text-2xl text-[var(--sec-ink)]">You don't have access to this</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--sec-muted)]">
        This section is restricted to certain roles. If you think this is wrong,
        ask an admin to check your account's role.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-md bg-[var(--sec-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
