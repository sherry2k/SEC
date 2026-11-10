import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { portalCredentials, users } from "@/db/schema";
import { encryptSecret, decryptSecret } from "@/lib/credentials-crypto";

export { PORTAL_CREDENTIAL_CATEGORIES } from "@/lib/portal-credentials-constants";
export type { PortalCredentialCategory } from "@/lib/portal-credentials-constants";

export type PortalCredentialRow = {
  id: string;
  name: string;
  category: string;
  url: string;
  username: string;
  // Decrypted — only ever computed for an already-authorized
  // Admin/Master Admin request (see requirePermission("credentials.manage")
  // in app/(dashboard)/portal-credentials/page.tsx).
  password: string;
  notes: string;
  updatedByName: string | null;
  updatedAtLabel: string;
};

// A credential saved before CREDENTIALS_ENCRYPTION_KEY was set, or whose
// value was corrupted, should never take down the whole list page — show a
// clear per-row warning instead of letting the decrypt throw.
function safeDecrypt(stored: string): string {
  try {
    return decryptSecret(stored);
  } catch {
    return "⚠ Could not decrypt — check CREDENTIALS_ENCRYPTION_KEY";
  }
}

export async function getPortalCredentials(): Promise<PortalCredentialRow[]> {
  const rows = await db
    .select({
      id: portalCredentials.id,
      name: portalCredentials.name,
      category: portalCredentials.category,
      url: portalCredentials.url,
      username: portalCredentials.username,
      passwordEnc: portalCredentials.passwordEnc,
      notes: portalCredentials.notes,
      updatedAt: portalCredentials.updatedAt,
      updatedByName: users.name,
    })
    .from(portalCredentials)
    .leftJoin(users, eq(portalCredentials.updatedBy, users.id))
    .orderBy(portalCredentials.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    url: r.url ?? "",
    username: r.username ?? "",
    password: safeDecrypt(r.passwordEnc),
    notes: r.notes ?? "",
    updatedByName: r.updatedByName,
    updatedAtLabel: r.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  }));
}

export { encryptSecret };
