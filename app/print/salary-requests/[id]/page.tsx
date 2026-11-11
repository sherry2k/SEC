import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { salaryRequests, salaryRequestItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import SalaryRequestPrintBody from "@/components/SalaryRequestPrintBody";
import { arabicFont } from "@/lib/fonts";

export default async function SalaryRequestPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [reqRow] = await db.select().from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!reqRow) notFound();

  const items = await db
    .select()
    .from(salaryRequestItems)
    .where(eq(salaryRequestItems.requestId, id))
    .orderBy(asc(salaryRequestItems.sortOrder));

  return (
    <div
      className={`mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)] ${arabicFont.variable}`}
      style={{ fontFamily: "Arial, Helvetica, var(--font-arabic), sans-serif" }}
    >
      <SalaryRequestPrintBody
        request={{
          requestNo: reqRow.requestNo,
          payMonth: reqRow.payMonth,
          notes: reqRow.notes ?? "",
          items: items.map((i) => ({ employeeName: i.employeeName, designation: i.designation ?? "", amount: Number(i.amount) })),
        }}
      />
    </div>
  );
}
