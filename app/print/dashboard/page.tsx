import { requireRole } from "@/lib/auth";
import { getDashboardForPrint } from "@/lib/dashboard-print-data";
import DashboardPrintBody from "@/components/DashboardPrintBody";

export default async function DashboardPrintSourcePage() {
  const user = await requireRole();
  const data = await getDashboardForPrint(user.role);

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)]">
      <DashboardPrintBody data={data} />
    </div>
  );
}
