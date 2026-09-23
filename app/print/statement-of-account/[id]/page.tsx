import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getStatementOfAccountData } from "@/lib/statement-data";
import StatementOfAccountPrintBody from "@/components/StatementOfAccountPrintBody";

export default async function StatementOfAccountPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;
  const data = await getStatementOfAccountData(id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <StatementOfAccountPrintBody data={data} />
    </div>
  );
}
