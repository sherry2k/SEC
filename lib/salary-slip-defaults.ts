export type SalarySlipItemDraft = {
  key: string;
  type: "earning" | "deduction";
  description: string;
  amount: string;
};

export function emptySalaryItem(type: "earning" | "deduction" = "earning"): SalarySlipItemDraft {
  return {
    key: `sal-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    description: "",
    amount: "",
  };
}

export type SalarySlipFormValues = {
  employeeId: string; // "" = no linked system account
  employeeName: string;
  designation: string;
  payMonth: string; // "YYYY-MM"
  issueDate: string; // "DD/MM/YYYY"
  signatoryName: string;
  showStamp: boolean;
  notes: string;
  items: SalarySlipItemDraft[];
};

function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function defaultSalarySlipValues(): SalarySlipFormValues {
  return {
    employeeId: "",
    employeeName: "",
    designation: "",
    payMonth: currentMonthKey(),
    issueDate: todayFormatted(),
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    notes: "",
    items: [emptySalaryItem("earning")],
  };
}
