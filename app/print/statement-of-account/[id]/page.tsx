import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getStatementOfAccountData } from "@/lib/statement-data";
import StatementOfAccountPrintBody from "@/components/StatementOfAccountPrintBody";
import PrintWatermark from "@/components/PrintWatermark";
import PrintWatermarkFirstPage from "@/components/PrintWatermarkFirstPage";

export default async function StatementOfAccountPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;
  const data = await getStatementOfAccountData(id);
  if (!data) notFound();

  return (
    <>
      <PrintWatermark />
      <div className="relative mx-auto max-w-[780px] bg-white px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
        <PrintWatermarkFirstPage />
      <StatementOfAccountPrintBody data={data} />
    </div>
    </>
  );
}
