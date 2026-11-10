import { Lock } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getPortalCredentials } from "@/lib/portal-credentials";
import PortalCredentialsClient from "@/components/PortalCredentialsClient";

export default async function PortalCredentialsPage() {
  await requirePermission("credentials.manage");
  const credentials = await getPortalCredentials();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Portal Credentials</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <Lock size={12} />
          Admin &amp; Master Admin only
        </span>
      </div>
      <p className="mt-1 max-w-xl text-sm text-[var(--sec-muted)]">
        Usernames, passwords and sign-in links for official government, utility, telecom and banking portals — one
        secured place instead of scattered notes. Passwords are encrypted at rest.
      </p>

      <PortalCredentialsClient credentials={credentials} />
    </div>
  );
}
