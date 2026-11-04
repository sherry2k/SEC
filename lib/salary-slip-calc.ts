export type SalarySlipItemInput = { type: "earning" | "deduction"; description: string; amount: number };

export function calcSalarySlipTotals(items: SalarySlipItemInput[]) {
  const earningsTotal = items.filter((i) => i.type === "earning").reduce((sum, i) => sum + i.amount, 0);
  const deductionsTotal = items.filter((i) => i.type === "deduction").reduce((sum, i) => sum + i.amount, 0);
  const netPay = Math.round((earningsTotal - deductionsTotal) * 100) / 100;
  return { earningsTotal, deductionsTotal, netPay };
}
