import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documentRenewals, users } from "@/db/schema";

export const COMPANY_DOCUMENT_SUGGESTIONS = ["Trade License", "Classification Certificate", "Company Insurance"];
export const STAFF_DOCUMENT_SUGGESTIONS = ["Visa", "Labor Card", "Insurance", "Emirates ID", "Passport"];

export const EXPIRY_WARNING_DAYS = 30;

export type ExpiryStatus = "expired" | "expiring" | "valid";

export function getExpiryStatus(expiryDate: Date): { status: ExpiryStatus; daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return { status: "expired", daysUntil };
  if (daysUntil <= EXPIRY_WARNING_DAYS) return { status: "expiring", daysUntil };
  return { status: "valid", daysUntil };
}

export type DocumentRenewalRow = {
  id: string;
  userId: number | null;
  userName: string | null;
  documentType: string;
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string;
  notes: string | null;
  status: ExpiryStatus;
  daysUntil: number;
};

export async function getDocumentRenewals(): Promise<{ company: DocumentRenewalRow[]; staff: DocumentRenewalRow[] }> {
  const rows = await db
    .select({
      id: documentRenewals.id,
      userId: documentRenewals.userId,
      userName: users.name,
      documentType: documentRenewals.documentType,
      documentNumber: documentRenewals.documentNumber,
      issueDate: documentRenewals.issueDate,
      expiryDate: documentRenewals.expiryDate,
      notes: documentRenewals.notes,
    })
    .from(documentRenewals)
    .leftJoin(users, eq(documentRenewals.userId, users.id));

  const mapped: DocumentRenewalRow[] = rows.map((r) => {
    const { status, daysUntil } = getExpiryStatus(r.expiryDate);
    return {
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      documentType: r.documentType,
      documentNumber: r.documentNumber,
      issueDate: r.issueDate ? r.issueDate.toLocaleDateString("en-GB") : null,
      expiryDate: r.expiryDate.toLocaleDateString("en-GB"),
      notes: r.notes,
      status,
      daysUntil,
    };
  });

  const sortByExpiry = (a: DocumentRenewalRow, b: DocumentRenewalRow) => a.daysUntil - b.daysUntil;

  return {
    company: mapped.filter((r) => r.userId === null).sort(sortByExpiry),
    staff: mapped.filter((r) => r.userId !== null).sort(sortByExpiry),
  };
}

export type ExpiryAlert = { id: string; label: string; daysUntil: number; status: ExpiryStatus };

// Used by the Overview dashboard banner — anything expired or expiring
// within the warning window, across both company and staff documents.
export async function getExpiringAlerts(): Promise<ExpiryAlert[]> {
  const { company, staff } = await getDocumentRenewals();
  const all = [...company, ...staff];
  return all
    .filter((r) => r.status === "expired" || r.status === "expiring")
    .map((r) => ({
      id: r.id,
      label: r.userName ? `${r.userName}'s ${r.documentType}` : r.documentType,
      daysUntil: r.daysUntil,
      status: r.status,
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
