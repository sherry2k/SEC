import { ne } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getDocumentRenewals, COMPANY_DOCUMENT_SUGGESTIONS, STAFF_DOCUMENT_SUGGESTIONS } from "@/lib/document-renewals";
import DocumentRenewalsClient from "@/components/DocumentRenewalsClient";

export default async function DocumentRenewalsPage() {
  const user = await requirePermission("document_renewals.view");
  const canEdit = can(user.role, "document_renewals.edit");

  const { company, staff } = await getDocumentRenewals();

  // Groups by real account (userId) when present, otherwise by the typed
  // extra-staff name — the two are mutually exclusive on every row, so
  // this key always resolves to exactly one group per person.
  const staffGroups = Object.values(
    staff.reduce<Record<string, { key: string; userId: number | null; userName: string; rows: typeof staff }>>((acc, row) => {
      const key = row.userId !== null ? `user-${row.userId}` : `extra-${row.extraStaffName}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          userId: row.userId,
          userName: row.userId !== null ? row.userName ?? "Unknown" : row.extraStaffName ?? "Unknown",
          rows: [],
        };
      }
      acc[key].rows.push(row);
      return acc;
    }, {})
  );

  const allStaffRows = await db.select({ id: users.id, name: users.name }).from(users).where(ne(users.role, "master_admin"));

  const expiringCount = [...company, ...staff].filter((r) => r.status === "expired" || r.status === "expiring").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Document Renewals</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Trade License, certificates, and staff visas/insurance — tracked toward their expiry date.</p>

      {expiringCount > 0 && (
        <div className="mt-4 flex items-center gap-2.5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {expiringCount} document{expiringCount > 1 ? "s" : ""} expired or expiring within 30 days — see below.
          </span>
        </div>
      )}

      <DocumentRenewalsClient
        company={company}
        staffGroups={staffGroups}
        allStaff={allStaffRows}
        canEdit={canEdit}
        companyTypeSuggestions={COMPANY_DOCUMENT_SUGGESTIONS}
        staffTypeSuggestions={STAFF_DOCUMENT_SUGGESTIONS}
      />
    </div>
  );
}
