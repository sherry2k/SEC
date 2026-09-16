// Plain module, no "use client" — same reasoning as the other *-defaults
// files: the New page calls defaultTaxInvoiceValues() directly on the
// server, so this can't live inside a client-boundary component.

export type TaxInvoiceItemDraft = {
  key: string;
  itemDate: string;
  description: string;
  amount: string;
};

export function emptyTaxItem(): TaxInvoiceItemDraft {
  return {
    key: `tax-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    itemDate: "",
    description: "",
    amount: "",
  };
}

export type TaxInvoiceFormValues = {
  issueDate: string;
  clientName: string;
  clientAddress: string;
  clientTrn: string;
  vatRatePercent: number;
  signatoryName: string;
  showStamp: boolean;
  items: TaxInvoiceItemDraft[];
};

function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function defaultTaxInvoiceValues(): TaxInvoiceFormValues {
  return {
    issueDate: todayFormatted(),
    clientName: "",
    clientAddress: "Abu Dhabi - UAE",
    clientTrn: "",
    vatRatePercent: 5,
    signatoryName: "Eng. Mohammad Abu Eisa",
    showStamp: false,
    items: [emptyTaxItem()],
  };
}
