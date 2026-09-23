import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getInvoiceForPrint } from "@/lib/invoice-data";
import InvoicePrintBody from "@/components/InvoicePrintBody";

export default async function InvoicePrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;
  const invoice = await getInvoiceForPrint(id);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-relaxed text-[var(--sec-ink)]">
      <InvoicePrintBody invoice={invoice} />
    </div>
  );
}
