import { requirePermission } from "@/lib/auth";
import { getSalaryReport } from "@/lib/salary-report";
import SalaryReportPrintBody from "@/components/SalaryReportPrintBody";

export default async function SalaryReportPrintSourcePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requirePermission("accounts.view");

  const { month } = await searchParams;
  const now = new Date();
  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const report = await getSalaryReport(monthKey);

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <SalaryReportPrintBody report={report} monthLabel={monthLabel} />
    </div>
  );
}
