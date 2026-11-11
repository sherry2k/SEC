import { requireRole } from "@/lib/auth";
import { getDashboardForPrint } from "@/lib/dashboard-print-data";
import DashboardPrintBody from "@/components/DashboardPrintBody";
import { arabicFont } from "@/lib/fonts";

export default async function DashboardPrintSourcePage() {
  const user = await requireRole();
  const data = await getDashboardForPrint(user.role);

  return (
    <div
      className={`mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)] ${arabicFont.variable}`}
      style={{ fontFamily: "Arial, Helvetica, var(--font-arabic), sans-serif" }}
    >
      <DashboardPrintBody data={data} />
    </div>
  );
}
