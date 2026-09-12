// Client-safe math shared between the builder form (live preview) and the
// print view (final render) so the two never disagree on a total.

export type QuotationItemInput = {
  description: string;
  classification: string;
  feeExclVat: number;
};

export function calcItemTotals(feeExclVat: number, vatRatePercent: number) {
  const vatAmount = Math.round(feeExclVat * (vatRatePercent / 100) * 100) / 100;
  const totalInclVat = Math.round((feeExclVat + vatAmount) * 100) / 100;
  return { vatAmount, totalInclVat };
}

export function calcGrandTotals(items: QuotationItemInput[], vatRatePercent: number) {
  const subtotal = items.reduce((sum, i) => sum + i.feeExclVat, 0);
  const { vatAmount: vatTotal, totalInclVat: grandTotal } = calcItemTotals(subtotal, vatRatePercent);
  return { subtotal, vatTotal, grandTotal };
}

// Groups line items by their exact classification text (e.g. every item
// marked "Mandatory" together, every "Optional" together) so the Financial
// Summary can show a subtotal per group without guessing at SEC's business
// rules for which group a borderline item belongs to.
export function groupByClassification(items: QuotationItemInput[], vatRatePercent: number) {
  const order: string[] = [];
  const groups = new Map<string, QuotationItemInput[]>();
  for (const item of items) {
    const key = item.classification?.trim() || "Other";
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(item);
  }
  return order.map((key) => ({
    label: key,
    ...calcGrandTotals(groups.get(key)!, vatRatePercent),
  }));
}
