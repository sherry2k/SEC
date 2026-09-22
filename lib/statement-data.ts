import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getProjectFinancials } from "@/lib/project-finance";
import type { StatementOfAccountData } from "@/components/StatementOfAccountPrintBody";

export async function getStatementOfAccountData(id: string): Promise<StatementOfAccountData | null> {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return null;

  const financials = await getProjectFinancials(id);

  return {
    projectRef: project.municipalityNo || project.projectCode,
    printedDate: new Date().toLocaleDateString("en-GB"),
    clientName: project.clientName ?? "",
    clientAddress: project.location ?? "",
    totalAmount: financials.totalAmount,
    invoicedTotal: financials.invoicedTotal,
    paidTotal: financials.paidTotal,
    balance: financials.balance,
    ledger: financials.ledger,
    showStamp: project.statementShowStamp,
  };
}
