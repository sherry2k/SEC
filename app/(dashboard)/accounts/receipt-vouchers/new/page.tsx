import { requirePermission } from "@/lib/auth";
import ReceiptVoucherForm from "@/components/ReceiptVoucherForm";
import { defaultReceiptVoucherValues } from "@/lib/receipt-voucher-defaults";

export default async function NewReceiptVoucherPage() {
  await requirePermission("accounts.edit");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New receipt voucher</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <ReceiptVoucherForm mode="create" initial={defaultReceiptVoucherValues()} />
      </div>
    </div>
  );
}
