// Plain module, no "use client" — same reasoning as lib/quotation-defaults.ts.
// Server Components call defaultInvoiceValues() directly (New page),
// so it can't live inside a client-boundary file.

export type InvoiceItemDraft = {
  key: string;
  itemDate: string;
  description: string;
  amount: string;
};

export function emptyInvoiceItem(): InvoiceItemDraft {
  return {
    key: `inv-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    itemDate: "",
    description: "",
    amount: "",
  };
}

export type InvoiceFormValues = {
  issueDate: string;
  customerName: string;
  project: string;
  customerAddress: string;
  projectId: string; // "" = not linked to a project
  vatRatePercent: number;
  signatoryName: string;
  showStamp: boolean;
  items: InvoiceItemDraft[];
};

function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// issueDate defaults to today (a sensible starting value, not "content" to
// delete) — every other field starts blank, per the no-prewritten-text rule.
export function defaultInvoiceValues(): InvoiceFormValues {
  return {
    issueDate: todayFormatted(),
    customerName: "",
    project: "",
    customerAddress: "Abu Dhabi - UAE",
    projectId: "",
    vatRatePercent: 5,
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    items: [emptyInvoiceItem()],
  };
}
