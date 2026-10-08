import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getProjectFinancials } from "@/lib/project-finance";
import StatementOfAccountPrintBody from "@/components/StatementOfAccountPrintBody";

// Loaded only by the server-side PDF generator (Puppeteer), never linked
// to directly — no letterhead/footer here, since those come from
// Puppeteer's own header/footer templates instead. Still requires the
// same login as the normal view; the PDF route forwards the visitor's
// session cookie when it loads this page.
export default async function StatementOfAccountPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();

  const financials = await getProjectFinancials(id);

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <StatementOfAccountPrintBody
        data={{
          projectRef: project.municipalityNo || project.projectCode,
          printedDate: new Date().toLocaleDateString("en-GB"),
          clientName: project.clientName ?? "",
          clientAddress: project.location ?? "",
          totalAmount: project.totalAmount ? Number(project.totalAmount) : 0,
          invoicedTotal: financials.invoicedTotal,
          paidTotal: financials.paidTotal,
          balance: financials.balance,
          ledger: financials.ledger,
          showStamp: project.statementShowStamp,
        }}
      />
    </div>
  );
}
