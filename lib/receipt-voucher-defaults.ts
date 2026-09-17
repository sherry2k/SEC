export type ReceiptVoucherItemDraft = {
  key: string;
  itemDate: string;
  description: string;
  amount: string;
};

export function emptyReceiptItem(): ReceiptVoucherItemDraft {
  return {
    key: `rv-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    itemDate: "",
    description: "",
    amount: "",
  };
}

export type ReceiptVoucherFormValues = {
  issueDate: string;
  toName: string;
  project: string;
  location: string;
  projectId: string; // "" = not linked to a project
  vatRatePercent: number;
  signatoryName: string;
  showStamp: boolean;
  items: ReceiptVoucherItemDraft[];
};

function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function defaultReceiptVoucherValues(): ReceiptVoucherFormValues {
  return {
    issueDate: todayFormatted(),
    toName: "",
    project: "",
    location: "Abu Dhabi - UAE",
    projectId: "",
    vatRatePercent: 5,
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    items: [emptyReceiptItem()],
  };
}
