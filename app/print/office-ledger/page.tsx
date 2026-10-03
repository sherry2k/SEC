import { requirePermission } from "@/lib/auth";
import { getOfficeLedgerSummary, getOfficeLedgerRangeSummary } from "@/lib/office-ledger";
import { OfficeLedgerSingleMonthPrintBody, OfficeLedgerRangePrintBody } from "@/components/OfficeLedgerPrintBody";

export default async function OfficeLedgerPrintSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; range?: string }>;
}) {
  await requirePermission("accounts.view");

  const { month, range } = await searchParams;
  const now = new Date();
  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const numMonths = range === "3" || range === "6" ? Number(range) : 1;

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)]">
      {numMonths === 1 ? (
        <OfficeLedgerSingleMonthPrintBody summary={await getOfficeLedgerSummary(monthKey)} monthLabel={monthLabel} />
      ) : (
        <OfficeLedgerRangePrintBody
          summary={await getOfficeLedgerRangeSummary(monthKey, numMonths)}
          rangeLabel={`${numMonths} Months ending ${monthLabel}`}
        />
      )}
    </div>
  );
}
