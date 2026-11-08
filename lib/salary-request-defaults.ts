export type SalaryRequestItemDraft = {
  key: string;
  employeeId: string; // "" = no linked system account
  employeeName: string;
  designation: string;
  amount: string;
};

export function emptySalaryRequestItem(): SalaryRequestItemDraft {
  return {
    key: `sreq-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    employeeId: "",
    employeeName: "",
    designation: "",
    amount: "",
  };
}

export type SalaryRequestFormValues = {
  payMonth: string; // "YYYY-MM"
  notes: string;
  items: SalaryRequestItemDraft[];
};

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function defaultSalaryRequestValues(): SalaryRequestFormValues {
  return {
    payMonth: currentMonthKey(),
    notes: "",
    items: [emptySalaryRequestItem()],
  };
}
