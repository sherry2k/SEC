import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { calcGrandTotals } from "@/lib/quotation-calc";

export default async function QuotationsListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(quotations).orderBy(desc(quotations.createdAt));
  const allItems = await db.select().from(quotationItems);

  const itemsByQuotation = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByQuotation.get(item.quotationId) ?? [];
    list.push(item);
    itemsByQuotation.set(item.quotationId, list);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Quotations</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "quotation" : "quotations"}
          </p>
        </div>
        <Link
          href="/accounts/quotations/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New quotation
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No quotations yet.</p>
          <Link href="/accounts/quotations/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Quotation No.</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Grand Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const items = (itemsByQuotation.get(q.id) ?? []).filter((i) => !i.section);
                const vat = Number(q.vatRatePercent) / 100;
                let grandTotal: number;
                if (q.category) {
                  const scopeFee = q.scopeFeeExclVat ? Number(q.scopeFeeExclVat) : 0;
                  const mandatoryTotal = (itemsByQuotation.get(q.id) ?? [])
                    .filter((i) => i.section === "mandatory")
                    .reduce((sum, i) => sum + Number(i.feeExclVat), 0);
                  grandTotal = (scopeFee + mandatoryTotal) * (1 + vat);
                } else {
                  const totals = calcGrandTotals(
                    items.map((i) => ({
                      description: i.description,
                      classification: i.classification ?? "",
                      feeExclVat: Number(i.feeExclVat),
                    })),
                    Number(q.vatRatePercent)
                  );
                  grandTotal = totals.grandTotal;
                }
                return (
                  <tr key={q.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/quotations/${q.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                        {q.quotationNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{q.clientName}</td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{q.projectDescription || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">
                      AED {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)] capitalize">{q.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">
                      {q.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
