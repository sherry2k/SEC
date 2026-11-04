export const SALARY_SLIP_STATUSES = ["draft", "paid"] as const;
export type SalarySlipStatus = (typeof SALARY_SLIP_STATUSES)[number];
export const SALARY_SLIP_STATUS_LABELS: Record<SalarySlipStatus, string> = {
  draft: "Draft",
  paid: "Paid",
};
