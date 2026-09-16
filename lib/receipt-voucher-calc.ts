export type ReceiptVoucherItemInput = { description: string; amount: number };

export function calcReceiptVoucherTotals(items: ReceiptVoucherItemInput[], vatRatePercent: number) {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const vatAmount = Math.round(subtotal * (vatRatePercent / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;
  return { subtotal, vatAmount, total };
}
