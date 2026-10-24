import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getAccountProjectStatementData } from "@/lib/account-project-statement";
import StatementOfAccountPrintBody from "@/components/StatementOfAccountPrintBody";

// Loaded only by the server-side PDF generator (Puppeteer), never linked
// to directly — no letterhead/footer here, since those come from
// Puppeteer's own header/footer templates instead. Still requires the
// same login as the normal view; the PDF route forwards the visitor's
// session cookie when it loads this page. Mirrors
// app/print/statement-of-account/[id]/page.tsx, sourced from an Account
// Project instead of a legacy project.
export default async function AccountProjectStatementPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const data = await getAccountProjectStatementData(id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <StatementOfAccountPrintBody data={data} />
    </div>
  );
}
