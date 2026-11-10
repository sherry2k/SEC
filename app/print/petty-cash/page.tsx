import { requirePermission } from "@/lib/auth";
import { getPettyCashSummary, getPettyCashRangeSummary, getPettyCashBalance } from "@/lib/petty-cash";
import { PettyCashSingleMonthPrintBody, PettyCashRangePrintBody } from "@/components/PettyCashPrintBody";

export default async function PettyCashPrintSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; range?: string }>;
}) {
  await requirePermission("accounts.view");

  const { month, range } = await searchParams;
  const now = new Date();
  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const numMonths = range === "3" || range === "6" || range === "12" ? Number(range) : 1;

  const balance = await getPettyCashBalance();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)]">
      {numMonths === 1 ? (
        <PettyCashSingleMonthPrintBody summary={await getPettyCashSummary(monthKey)} monthLabel={monthLabel} balance={balance} />
      ) : (
        <PettyCashRangePrintBody
          summary={await getPettyCashRangeSummary(monthKey, numMonths)}
          rangeLabel={`${numMonths} Months ending ${monthLabel}`}
          balance={balance}
        />
      )}
    </div>
  );
}
